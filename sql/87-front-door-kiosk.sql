-- ============================================================
-- FRONT DOOR KIOSK (self check-in at the door)
-- Run after 40, 52, 71 and 83. Safe to re-run.
--
-- A tablet at the door runs kiosk.html, signed in with a "Front Door
-- Kiosk" account (role 'kiosk' — no staff access) or any staff account.
-- A member checks in one of two ways:
--   QR     the kiosk shows a code that changes every 30 seconds (each
--          one works for 2 minutes, so a photo of it is no use from
--          home). The member scans it with their phone, logged into the
--          app: qr_checkin().
--   Number the member types their phone number and check-in PIN on the
--          kiosk keypad: kiosk_phone_checkin(). 5 wrong PINs for one
--          number lock it for 15 minutes.
-- Both run the same check, bnb_door_checkin():
--   * blocked: archived or suspended, membership cancelled or not set
--     up, frozen, or ended (contract_end passed without auto-renew).
--   * overdue (mstatus 'overdue' or an unpaid invoice past its due
--     date): let in with a nudge twice, blocked from the third visit
--     until it's settled. Paying up resets the count.
--   * staff accounts are always let in.
-- Staff can still check anyone in by hand with Scan Check-in.
-- Members set their PIN on My Profile (set_checkin_pin); only a bcrypt
-- hash is stored.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.checkin_pins (
  user_id     uuid primary key references public.users(id) on delete cascade,
  pin_hash    text not null,
  updated_at  timestamptz not null default now()
);
alter table public.checkin_pins enable row level security;
revoke all on public.checkin_pins from anon, authenticated;

-- One row per member while they're overdue. overdue_since is the due date
-- of their oldest overdue invoice, so a new overdue spell starts a fresh
-- count.
create table if not exists public.checkin_overdue_nudges (
  member_id       uuid primary key references public.users(id) on delete cascade,
  nudges          integer not null default 0,
  overdue_since   date,
  last_nudged_on  date
);
alter table public.checkin_overdue_nudges enable row level security;
drop policy if exists "staff read overdue nudges" on public.checkin_overdue_nudges;
create policy "staff read overdue nudges" on public.checkin_overdue_nudges for select
  using (is_staff());
revoke all on public.checkin_overdue_nudges from anon;
grant select on public.checkin_overdue_nudges to authenticated;

create table if not exists public.kiosk_tokens (
  token       text primary key,
  kiosk_id    uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.kiosk_tokens enable row level security;
revoke all on public.kiosk_tokens from anon, authenticated;

-- Results of QR check-ins, so the kiosk can show "Welcome, Sam".
create table if not exists public.kiosk_events (
  id          bigserial primary key,
  kiosk_id    uuid not null references public.users(id) on delete cascade,
  result      jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists kiosk_events_kiosk_idx on public.kiosk_events (kiosk_id, id);
alter table public.kiosk_events enable row level security;
revoke all on public.kiosk_events from anon, authenticated;

create table if not exists public.kiosk_pin_failures (
  phone_key  text not null,
  at         timestamptz not null default now()
);
create index if not exists kiosk_pin_failures_idx on public.kiosk_pin_failures (phone_key, at);
alter table public.kiosk_pin_failures enable row level security;
revoke all on public.kiosk_pin_failures from anon, authenticated;

-- Check-ins now only come from staff (Scan Check-in) or these functions.
-- The member app never inserted its own; leaving the policy would let a
-- blocked member skip the door check with a direct API call.
drop policy if exists "members create own checkins" on public.checkins;

-- ---------------- HELPERS ----------------

-- Last 9 digits, so "0712 345 678", "+254712345678" and "712345678"
-- all match.
create or replace function bnb_phone_key(p text)
returns text
language sql
immutable
as $$ select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 9); $$;

create or replace function is_kiosk()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where auth_id = auth.uid()
      and roles && array['kiosk','admin','trainer','staff']::text[]
      and status <> 'suspended' and archived_at is null
  );
$$;

-- The door check. Internal: called only by the functions below.
create or replace function bnb_door_checkin(p_member uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  u public.users%rowtype;
  v_today date := gym_local_now()::date;
  v_first text;
  v_freeze_end date;
  v_owing numeric;
  v_since date;
  v_nudges integer := 0;
  v_msg text := '';
  n public.checkin_overdue_nudges%rowtype;
  desk constant text := ' Please see the front desk.';
begin
  select * into u from public.users where id = p_member;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'We couldn''t find that membership.' || desk);
  end if;
  v_first := split_part(trim(u.full_name), ' ', 1);

  if exists (select 1 from public.checkins where user_id = u.id and date = v_today) then
    return jsonb_build_object('ok', true, 'name', v_first, 'already', true, 'message', 'You''re already checked in today.');
  end if;

  if not (u.roles && array['admin','trainer','staff']::text[]) then
    if u.archived_at is not null or u.status = 'suspended' then
      return jsonb_build_object('ok', false, 'name', v_first, 'message', 'Your account isn''t active.' || desk);
    end if;
    if u.mstatus = 'cancelled' then
      return jsonb_build_object('ok', false, 'name', v_first, 'message', 'Your membership is cancelled.' || desk);
    end if;
    if u.mstatus = 'pending' then
      return jsonb_build_object('ok', false, 'name', v_first, 'message', 'Your membership isn''t set up yet.' || desk);
    end if;
    select max(ends_on) into v_freeze_end from public.membership_freezes
    where member_id = u.id and status = 'approved' and starts_on <= v_today and ends_on >= v_today;
    if v_freeze_end is not null or u.mstatus = 'hold' then
      return jsonb_build_object('ok', false, 'name', v_first, 'message', 'Your membership is frozen' ||
        coalesce(' until ' || to_char(v_freeze_end, 'FMDD Mon YYYY'), '') || '.' || desk);
    end if;
    if u.contract_end is not null and u.contract_end < v_today and not coalesce(u.auto_renew, false) then
      return jsonb_build_object('ok', false, 'name', v_first, 'message', 'Your membership ended on ' ||
        to_char(u.contract_end, 'FMDD Mon YYYY') || '.' || desk);
    end if;

    select sum(owing), min(due_date) into v_owing, v_since
    from owing_invoices() where user_id = u.id and due_date < v_today;
    if coalesce(v_owing, 0) > 0 or u.mstatus = 'overdue' then
      select * into n from public.checkin_overdue_nudges where member_id = u.id;
      if found and n.overdue_since is not distinct from v_since then v_nudges := n.nudges; end if;
      if v_nudges >= 2 then
        return jsonb_build_object('ok', false, 'name', v_first, 'overdue', true, 'message',
          'Your account is overdue' || coalesce(' (' || bnb_money(v_owing) || ')', '') ||
          ', so check-in is paused until it''s settled.' || desk);
      end if;
      v_nudges := v_nudges + 1;
      insert into public.checkin_overdue_nudges (member_id, nudges, overdue_since, last_nudged_on)
      values (u.id, v_nudges, v_since, v_today)
      on conflict (member_id) do update
        set nudges = excluded.nudges, overdue_since = excluded.overdue_since, last_nudged_on = excluded.last_nudged_on;
      v_msg := 'Your account is overdue' || coalesce(' (' || bnb_money(v_owing) || ')', '') || '. ' ||
        case when v_nudges = 1 then 'Please settle it soon: one more visit, then check-in is paused.'
             else 'This is your last visit before check-in is paused. Please see the front desk.' end;
    else
      delete from public.checkin_overdue_nudges where member_id = u.id;
    end if;
  end if;

  insert into public.checkins (user_id, date) values (u.id, v_today) on conflict do nothing;
  return jsonb_build_object('ok', true, 'name', v_first, 'nudge', v_nudges, 'message', v_msg);
end;
$$;
revoke all on function bnb_door_checkin(uuid) from public, anon, authenticated;

-- ---------------- MEMBER ----------------

create or replace function set_checkin_pin(p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_me uuid := my_user_id();
begin
  if v_me is null then raise exception 'Log in first.'; end if;
  if coalesce(p_pin, '') !~ '^\d{4,6}$' then raise exception 'Your PIN must be 4 to 6 digits.'; end if;
  insert into public.checkin_pins (user_id, pin_hash, updated_at)
  values (v_me, crypt(p_pin, gen_salt('bf', 8)), now())
  on conflict (user_id) do update set pin_hash = excluded.pin_hash, updated_at = now();
end;
$$;

create or replace function has_checkin_pin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from public.checkin_pins where user_id = my_user_id()); $$;

-- The member scanned the kiosk's code.
create or replace function qr_checkin(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := my_user_id();
  v_kiosk uuid;
  v_result jsonb;
begin
  if v_me is null then raise exception 'Log in first.'; end if;
  select kiosk_id into v_kiosk from public.kiosk_tokens
  where token = p_token and created_at > now() - interval '2 minutes';
  if v_kiosk is null then
    return jsonb_build_object('ok', false, 'expired', true, 'message', 'That door code has expired. Scan the code on the screen again.');
  end if;
  v_result := bnb_door_checkin(v_me);
  insert into public.kiosk_events (kiosk_id, result) values (v_kiosk, v_result);
  return v_result;
end;
$$;

-- ---------------- KIOSK ----------------

create or replace function kiosk_new_token()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_token text := encode(gen_random_bytes(12), 'hex');
begin
  if not is_kiosk() then raise exception 'This account can''t run the front door kiosk.'; end if;
  delete from public.kiosk_tokens where created_at < now() - interval '10 minutes';
  delete from public.kiosk_events where created_at < now() - interval '1 day';
  insert into public.kiosk_tokens (token, kiosk_id) values (v_token, my_user_id());
  return v_token;
end;
$$;

-- QR check-ins on this kiosk since p_after (an id it already showed).
create or replace function kiosk_events_since(p_after bigint)
returns table (id bigint, result jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_kiosk() then raise exception 'This account can''t run the front door kiosk.'; end if;
  return query
    select e.id, e.result from public.kiosk_events e
    where e.kiosk_id = my_user_id() and e.id > coalesce(p_after, 0) and e.created_at > now() - interval '1 minute'
    order by e.id;
end;
$$;

create or replace function kiosk_phone_checkin(p_phone text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text := bnb_phone_key(p_phone);
  v_member uuid;
begin
  if not is_kiosk() then raise exception 'This account can''t run the front door kiosk.'; end if;
  if length(v_key) < 7 then
    return jsonb_build_object('ok', false, 'retry', true, 'message', 'Enter the phone number on your membership.');
  end if;
  if (select count(*) from public.kiosk_pin_failures where phone_key = v_key and at > now() - interval '15 minutes') >= 5 then
    return jsonb_build_object('ok', false, 'message', 'Too many wrong PINs. Try again in 15 minutes, or see the front desk.');
  end if;

  select u.id into v_member
  from public.users u join public.checkin_pins p on p.user_id = u.id
  where bnb_phone_key(u.phone) = v_key and p.pin_hash = crypt(coalesce(p_pin, ''), p.pin_hash)
  limit 1;

  if v_member is null then
    delete from public.kiosk_pin_failures where at < now() - interval '1 day';
    if exists (select 1 from public.users where bnb_phone_key(phone) = v_key and archived_at is null)
       and not exists (select 1 from public.users u join public.checkin_pins p on p.user_id = u.id where bnb_phone_key(u.phone) = v_key) then
      return jsonb_build_object('ok', false, 'message', 'You haven''t set a check-in PIN yet. Set one on My Profile in the app, or see the front desk.');
    end if;
    insert into public.kiosk_pin_failures (phone_key) values (v_key);
    return jsonb_build_object('ok', false, 'retry', true, 'message', 'That number and PIN don''t match. Try again.');
  end if;

  delete from public.kiosk_pin_failures where phone_key = v_key;
  return bnb_door_checkin(v_member);
end;
$$;

revoke all on function set_checkin_pin(text) from public, anon;
revoke all on function has_checkin_pin() from public, anon;
revoke all on function qr_checkin(text) from public, anon;
revoke all on function kiosk_new_token() from public, anon;
revoke all on function kiosk_events_since(bigint) from public, anon;
revoke all on function kiosk_phone_checkin(text, text) from public, anon;
grant execute on function set_checkin_pin(text) to authenticated;
grant execute on function has_checkin_pin() to authenticated;
grant execute on function qr_checkin(text) to authenticated;
grant execute on function kiosk_new_token() to authenticated;
grant execute on function kiosk_events_since(bigint) to authenticated;
grant execute on function kiosk_phone_checkin(text, text) to authenticated;
