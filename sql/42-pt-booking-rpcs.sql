-- ============================================================
-- 1-ON-1 BOOKING VIA SERVER FUNCTIONS
-- Run AFTER 41-coach-ratings.sql (uses gym_local_now() from there).
--
-- Until now a member's 1-on-1 booking was three separate client-side
-- writes, and two of them never actually reached the database:
--   1. insert pt_bookings row  — allowed by RLS, so a member could
--      insert ANY booking, including a fake past session (which would
--      unlock coach ratings without ever training with the coach);
--   2. mark the slot 'booked' — silently blocked (members can't update
--      slots), so the slot stayed 'open' and could be double-booked;
--   3. deduct a credit         — silently blocked by
--      protect_staff_only_user_columns(), so credits never went down.
-- Cancelling had the same problem: members have no update policy on
-- pt_bookings or slots, so a member's cancel never saved either.
--
-- Now both go through SECURITY DEFINER functions that do every step
-- in one transaction, and the member insert policy is dropped, so
-- these functions are the only way a member creates a booking.
-- Staff keep their existing full access to both tables.
--
-- Rules (per the gym's decision):
--   * Booking requires at least 1 credit — refused, not warned.
--   * Only future slots can be booked.
--   * Cancelling more than 24h before the session refunds the credit;
--     inside 24h it doesn't. A cancel by staff/coach always refunds.
-- ============================================================

-- Whether this booking actually spent a credit — so a cancel only ever
-- refunds a credit that was really taken. Existing rows default to
-- false, which is accurate: the old client-side deduction never saved.
alter table public.pt_bookings add column if not exists credit_used boolean not null default false;

-- ---------------- DATA FIX ----------------
-- Slots with a confirmed booking that stayed 'open' because of (2)
-- above. Only touches slots that are actually booked; a slot that
-- somehow has two confirmed bookings is left for staff to sort out
-- (see the check query at the bottom).
update public.slots s set status = 'booked'
where s.status = 'open'
and exists (
  select 1 from public.pt_bookings p
  where p.slot_id = s.id and p.status = 'confirmed'
);

-- ---------------- BOOK ----------------
-- p_member_id lets staff book on a member's behalf (the "Booking as"
-- picker); a non-staff caller can only ever book for themselves.
create or replace function book_pt_slot(p_slot_id uuid, p_member_id uuid default null)
returns integer  -- the member's remaining credits
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_member uuid := coalesce(p_member_id, caller);
  v_slot public.slots%rowtype;
  v_credits integer;
  v_start timestamp;
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;
  if v_member <> caller and not is_staff() then
    raise exception 'You can only book sessions for yourself.';
  end if;

  -- Row lock: two members hitting Book on the same slot at once are
  -- serialized here, and the second one sees it's no longer open.
  select * into v_slot from public.slots where id = p_slot_id for update;
  if not found then
    raise exception 'That slot no longer exists.';
  end if;
  if v_slot.status <> 'open' or exists (
    select 1 from public.pt_bookings where slot_id = p_slot_id and status = 'confirmed'
  ) then
    raise exception 'That slot is no longer available.';
  end if;

  v_start := v_slot.date + v_slot.start_time;
  if v_start <= gym_local_now() then
    raise exception 'That slot has already started.';
  end if;

  if exists (
    select 1 from public.pt_bookings p
    join public.slots s on s.id = p.slot_id
    where p.user_id = v_member and p.status = 'confirmed'
    and s.date = v_slot.date
    and s.start_time < v_slot.start_time + make_interval(mins => coalesce(v_slot.duration, 60))
    and v_slot.start_time < s.start_time + make_interval(mins => coalesce(s.duration, 60))
  ) then
    raise exception 'You already have a 1-on-1 session that overlaps this time.';
  end if;

  select coalesce(credits, 0) into v_credits from public.users where id = v_member for update;
  if v_credits is null then
    raise exception 'Member not found.';
  end if;
  if v_credits < 1 then
    raise exception 'No session credits left. Buy a package or redeem points to book.';
  end if;

  insert into public.pt_bookings (slot_id, trainer_id, user_id, status, credit_used)
  values (p_slot_id, v_slot.trainer_id, v_member, 'confirmed', true);

  update public.slots set status = 'booked' where id = p_slot_id;

  perform set_config('bnb.system_write', 'on', true);
  update public.users set credits = v_credits - 1 where id = v_member;
  perform set_config('bnb.system_write', 'off', true);

  return v_credits - 1;
end;
$$;

revoke execute on function book_pt_slot(uuid, uuid) from public;
grant execute on function book_pt_slot(uuid, uuid) to authenticated;

-- ---------------- CANCEL ----------------
-- Returns true if a credit was refunded, so the UI can say so.
create or replace function cancel_pt_booking(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_staff boolean := is_staff();
  v_booking public.pt_bookings%rowtype;
  v_start timestamp;
  v_refund boolean;
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;

  select * into v_booking from public.pt_bookings where id = p_booking_id for update;
  if not found or (v_booking.user_id <> caller and not v_staff) then
    raise exception 'Booking not found.';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception 'That booking is already cancelled.';
  end if;

  select s.date + s.start_time into v_start from public.slots s where s.id = v_booking.slot_id;
  if not v_staff and v_start <= gym_local_now() then
    raise exception 'That session has already started — ask your coach if you need to change it.';
  end if;

  -- Staff/coach cancelling is the gym's call, not the member's, so the
  -- member never loses the credit for it.
  v_refund := v_booking.credit_used and (v_staff or v_start > gym_local_now() + interval '24 hours');

  update public.pt_bookings set status = 'cancelled' where id = p_booking_id;
  update public.slots set status = 'open' where id = v_booking.slot_id and status = 'booked';

  if v_refund then
    perform set_config('bnb.system_write', 'on', true);
    update public.users set credits = coalesce(credits, 0) + 1 where id = v_booking.user_id;
    perform set_config('bnb.system_write', 'off', true);
  end if;

  return v_refund;
end;
$$;

revoke execute on function cancel_pt_booking(uuid) from public;
grant execute on function cancel_pt_booking(uuid) to authenticated;

-- ---------------- LOCK DOWN DIRECT MEMBER INSERTS ----------------
drop policy if exists "members create own pt_bookings" on public.pt_bookings;

-- ============================================================
-- Check for slots that were double-booked under the old flow (should
-- return nothing; if it returns rows, cancel the extra booking(s) by
-- hand as staff):
--   select slot_id, count(*) from public.pt_bookings
--   where status = 'confirmed' group by slot_id having count(*) > 1;
--
-- Verify:
-- 1. As a member with 0 credits: select book_pt_slot('<open future slot>');
--    → "No session credits left".
-- 2. With 1+ credits: same call returns credits - 1; the slot is now
--    'booked'; calling it again → "no longer available".
-- 3. As a member: insert into pt_bookings (...) directly → RLS error.
-- 4. Cancel a booking 2+ days out → returns true, credit back.
--    Cancel one less than 24h out → returns false, no credit back.
-- ============================================================
