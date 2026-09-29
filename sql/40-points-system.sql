-- ============================================================
-- POINTS SYSTEM (V1, DB-enforced)
-- Members earn points for checking in and for hitting streak
-- milestones, and can redeem points for a free PT session credit.
-- Everything that changes a balance — earning or redeeming — runs
-- through a SECURITY DEFINER function, never a plain client-side
-- UPDATE, so nothing here can be spoofed by a member editing their
-- own request. `points` are kept deliberately separate from `credits`
-- (a purchased, real-money PT-session currency) — redeeming just
-- calls the same credits column that billing already uses.
-- ============================================================

-- ---------------- POINTS LEDGER ----------------
-- The ledger IS the balance — there's no separate `users.points`
-- column to keep in sync or that could drift from what actually
-- happened. A balance is just sum(delta) for that member. This also
-- sidesteps a real conflict: protect_staff_only_user_columns()
-- already blocks non-staff changes to columns like `credits`, and a
-- denormalized `points` column would need the exact same protection
-- — simpler to just not have one.
create table if not exists public.points_ledger (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id),
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.points_ledger enable row level security;

drop policy if exists "members read own points_ledger" on public.points_ledger;
create policy "members read own points_ledger"
  on public.points_ledger for select
  using (user_id = my_user_id());

drop policy if exists "staff read all points_ledger" on public.points_ledger;
create policy "staff read all points_ledger"
  on public.points_ledger for select
  using (is_staff());

-- Deliberately no insert/update/delete policy for anyone, staff
-- included — every write goes through the SECURITY DEFINER functions
-- below (which run as the table owner and aren't subject to RLS),
-- so the ledger can never be hand-edited by a client, only appended
-- to through logic that also does the matching, validated balance
-- change.

-- ---------------- TRUSTED-WRITE ESCAPE HATCH ----------------
-- redeem_points_for_credit() below needs to increment `credits`,
-- which protect_staff_only_user_columns() (03/13) already blocks for
-- non-staff — correctly, for a direct client update. But that
-- function's own internal, validated update needs to get through.
-- This is the standard Postgres pattern for that: a transaction-local
-- flag only a trusted SECURITY DEFINER function can set, checked
-- here as an explicit bypass alongside is_staff(). A member has no
-- way to set this themselves and then piggyback a privileged update
-- in the same transaction — the Supabase client only ever issues one
-- statement (a single .update() or .rpc() call) per request/transaction.
create or replace function protect_staff_only_user_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_staff() or current_setting('bnb.system_write', true) = 'on' then
    return new;
  end if;

  if new.trainer_id is distinct from old.trainer_id then
    if new.trainer_id is not null and not exists (
      select 1 from public.users
      where id = new.trainer_id
      and status <> 'suspended'
      and roles && array['trainer']::text[]
    ) then
      raise exception 'You can only pick an active coach.';
    end if;
  end if;

  if new.roles      is distinct from old.roles      or
     new.status     is distinct from old.status     or
     new.balance    is distinct from old.balance    or
     new.credits    is distinct from old.credits    or
     new.comp       is distinct from old.comp       or
     new.plan       is distinct from old.plan       or
     new.mstatus    is distinct from old.mstatus    or
     new.contract_end   is distinct from old.contract_end   or
     new.flag           is distinct from old.flag           or
     new.internal_notes is distinct from old.internal_notes or
     new.lead_source    is distinct from old.lead_source    or
     new.auto_renew     is distinct from old.auto_renew     or
     new.trainer        is distinct from old.trainer        or
     new.last_checkin   is distinct from old.last_checkin
  then
    raise exception 'You do not have permission to change that field. Contact your coach/staff.';
  end if;

  return new;
end;
$$;

-- ---------------- EARNING: CHECK-IN + STREAK MILESTONES ----------------
-- A member could otherwise insert unlimited checkins for the same day
-- via a direct API call (the "already checked in today" guard is
-- client-side only) — fine before points existed, not fine once each
-- row is worth points. Clean up any existing duplicates (keeping the
-- earliest row per member/day) before locking it down.
delete from public.checkins a
using public.checkins b
where a.user_id = b.user_id and a.date = b.date and a.id > b.id;

alter table public.checkins drop constraint if exists checkins_user_date_unique;
alter table public.checkins add constraint checkins_user_date_unique unique (user_id, date);

create or replace function award_checkin_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_streak integer := 0;
  v_check_date date := new.date;
  v_bonus integer := 0;
begin
  insert into public.points_ledger(user_id, delta, reason) values (new.user_id, 10, 'Checked in');

  -- Consecutive days ending at (and including) the new checkin —
  -- walks backward one day at a time until a gap is found. Bounded by
  -- the streak length itself (at most a few hundred iterations for
  -- even a multi-year daily streak), fine for an AFTER INSERT trigger.
  loop
    exit when not exists (
      select 1 from public.checkins where user_id = new.user_id and date = v_check_date
    );
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  end loop;

  v_bonus := case v_streak
    when 7 then 50
    when 30 then 200
    when 90 then 500
    else 0
  end;

  if v_bonus > 0 then
    insert into public.points_ledger(user_id, delta, reason)
    values (new.user_id, v_bonus, v_streak || '-day streak bonus');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_award_checkin_points on public.checkins;
create trigger trg_award_checkin_points
  after insert on public.checkins
  for each row
  execute function award_checkin_points();

-- ---------------- REDEEMING: POINTS -> PT SESSION CREDIT ----------------
-- Cost is fixed here, server-side, deliberately not a parameter — a
-- client passing its own "cost" is exactly the kind of thing this
-- whole design is meant to prevent.
create or replace function redeem_points_for_credit()
returns integer -- returns the member's new points balance
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost constant integer := 500;
  v_uid uuid := my_user_id();
  v_balance integer;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;

  select coalesce(sum(delta), 0) into v_balance from public.points_ledger where user_id = v_uid;
  if v_balance < v_cost then
    raise exception 'Not enough points yet — you need % but have %.', v_cost, v_balance;
  end if;

  insert into public.points_ledger(user_id, delta, reason)
  values (v_uid, -v_cost, 'Redeemed for a PT session credit');

  perform set_config('bnb.system_write', 'on', true);
  update public.users set credits = coalesce(credits, 0) + 1 where id = v_uid;
  perform set_config('bnb.system_write', 'off', true);

  return v_balance - v_cost;
end;
$$;

revoke execute on function redeem_points_for_credit() from public;
grant execute on function redeem_points_for_credit() to authenticated;

-- ---------------- STAFF: MANUAL ADJUSTMENT ----------------
-- For comping points or correcting a mistake — mirrors how `comp`
-- already works for billing. Gated inside the function itself
-- (raises if the caller isn't staff) rather than relying only on a
-- client-side admin check.
create or replace function admin_adjust_points(p_user_id uuid, p_delta integer, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_staff() then
    raise exception 'Only staff can adjust points.';
  end if;
  if p_delta = 0 then
    raise exception 'Adjustment must be non-zero.';
  end if;
  insert into public.points_ledger(user_id, delta, reason)
  values (p_user_id, p_delta, coalesce(nullif(trim(p_reason), ''), 'Staff adjustment'));
end;
$$;

revoke execute on function admin_adjust_points(uuid, integer, text) from public;
grant execute on function admin_adjust_points(uuid, integer, text) to authenticated;

-- ============================================================
-- Verify:
-- 1. As a member, check in for the first time today — a
--    points_ledger row for +10 "Checked in" should appear, readable
--    via `select * from points_ledger where user_id = my_user_id();`.
-- 2. As that member, try inserting a second checkins row for the same
--    date directly — should fail on the new unique constraint.
-- 3. Build up a 7-day checkin streak (or fake it by inserting past
--    dates as staff) — the 7th day's checkin should add a second
--    ledger row, +50 "7-day streak bonus".
-- 4. As a member with fewer than 500 points, call
--    `select redeem_points_for_credit();` — should fail with "Not
--    enough points yet...".
-- 5. As a member with >= 500 points, call it again — should succeed,
--    add a -500 ledger row, and increase that member's `credits` by 1
--    (confirm via the Booking screen's credits count).
-- 6. As a member (not staff), call
--    `select admin_adjust_points(my_user_id(), 100, 'test');` —
--    should fail with "Only staff can adjust points."
-- 7. As staff, call the same — should succeed and add a ledger row.
-- ============================================================
