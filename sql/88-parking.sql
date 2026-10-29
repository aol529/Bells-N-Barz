-- ============================================================
-- PARKING (Admin > Parking)
-- Run after 41 and 87. Safe to re-run.
--
--   In    the guard types the plate: parking_enter().
--   Out   the desk finds the car (list or plate) and the fee so far:
--         parking_lookup(). The driver pays by M-Pesa to the gym's
--         paybill (account = plate) and the desk taps Paid, or taps
--         Exempt for a member: parking_checkout().
--   Fee   rate per started hour (20 KES to start), from parking_settings.
--   Free  a member whose plate is on their profile (member_vehicles) and
--         who checked in at the door that day. The door check (sql/87)
--         already turned away anyone frozen, cancelled or overdue too
--         long, so a check-in means they're entitled. The server checks
--         this again on Exempt; the button alone can't do it.
-- Paying is confirmed by hand from the M-Pesa SMS for now. Automatic
-- confirmation (Daraja STK push) can be added later.
-- ============================================================

create table if not exists public.parking_settings (
  id             integer primary key default 1 check (id = 1),
  rate_per_hour  numeric not null default 20,
  paybill        text not null default '',
  updated_at     timestamptz not null default now()
);
insert into public.parking_settings (id) values (1) on conflict (id) do nothing;
alter table public.parking_settings enable row level security;
drop policy if exists "staff read parking settings" on public.parking_settings;
create policy "staff read parking settings" on public.parking_settings for select using (is_staff());
drop policy if exists "admins update parking settings" on public.parking_settings;
create policy "admins update parking settings" on public.parking_settings for update using (is_admin()) with check (is_admin());
revoke all on public.parking_settings from anon;
grant select, update on public.parking_settings to authenticated;

-- "KDA 123A", "kda-123a" -> "KDA123A"
create or replace function bnb_plate(p text)
returns text
language sql
immutable
as $$ select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g')); $$;

create table if not exists public.member_vehicles (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.users(id) on delete cascade,
  plate       text not null check (plate = bnb_plate(plate) and length(plate) between 3 and 12),
  created_at  timestamptz not null default now(),
  unique (member_id, plate)
);
create index if not exists member_vehicles_plate_idx on public.member_vehicles (plate);
alter table public.member_vehicles enable row level security;
drop policy if exists "members manage own vehicles" on public.member_vehicles;
create policy "members manage own vehicles" on public.member_vehicles for all
  using (member_id = my_user_id()) with check (member_id = my_user_id());
drop policy if exists "staff full access vehicles" on public.member_vehicles;
create policy "staff full access vehicles" on public.member_vehicles for all
  using (is_staff()) with check (is_staff());
revoke all on public.member_vehicles from anon;
grant select, insert, delete on public.member_vehicles to authenticated;

create table if not exists public.parking_sessions (
  id          uuid primary key default gen_random_uuid(),
  plate       text not null,
  entered_at  timestamptz not null default now(),
  entered_by  uuid references public.users(id),
  exited_at   timestamptz,
  exited_by   uuid references public.users(id),
  outcome     text check (outcome in ('mpesa', 'cash', 'exempt')),
  fee         numeric,
  mpesa_ref   text,
  member_id   uuid references public.users(id)
);
-- One car can only be parked once at a time.
create unique index if not exists parking_sessions_open_idx on public.parking_sessions (plate) where exited_at is null;
create index if not exists parking_sessions_entered_idx on public.parking_sessions (entered_at desc);
alter table public.parking_sessions enable row level security;
drop policy if exists "staff read parking sessions" on public.parking_sessions;
create policy "staff read parking sessions" on public.parking_sessions for select using (is_staff());
revoke all on public.parking_sessions from anon;
grant select on public.parking_sessions to authenticated;

-- Fee for a stay: every started hour, at least one.
create or replace function bnb_parking_fee(p_from timestamptz, p_to timestamptz)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select greatest(1, ceil(extract(epoch from (p_to - p_from)) / 3600.0))
         * (select rate_per_hour from public.parking_settings where id = 1);
$$;

-- Members with this plate on their profile, and whether each one checked
-- in at the door between arriving and now (gym-local dates).
create or replace function bnb_plate_members(p_plate text, p_since timestamptz)
returns table (member_id uuid, full_name text, checked_in boolean)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.full_name,
         exists (select 1 from public.checkins c where c.user_id = u.id
                 and c.date between (p_since at time zone 'Africa/Nairobi')::date and gym_local_now()::date)
  from public.member_vehicles v join public.users u on u.id = v.member_id
  where v.plate = bnb_plate(p_plate) and u.archived_at is null and u.status <> 'suspended'
  order by 3 desc, 2;
$$;
revoke all on function bnb_plate_members(text, timestamptz) from public, anon, authenticated;

-- ---------------- STAFF ----------------

create or replace function parking_enter(p_plate text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plate text := bnb_plate(p_plate);
  s public.parking_sessions%rowtype;
  v_member text;
begin
  if not is_staff() then raise exception 'Parking is for staff accounts.'; end if;
  if length(v_plate) < 3 then raise exception 'Type the number plate.'; end if;
  select * into s from public.parking_sessions where plate = v_plate and exited_at is null;
  if found then
    return jsonb_build_object('id', s.id, 'plate', s.plate, 'entered_at', s.entered_at, 'already', true);
  end if;
  insert into public.parking_sessions (plate, entered_by) values (v_plate, my_user_id()) returning * into s;
  select full_name into v_member from bnb_plate_members(v_plate, now()) limit 1;
  return jsonb_build_object('id', s.id, 'plate', s.plate, 'entered_at', s.entered_at, 'member', v_member);
end;
$$;

-- What the desk sees at checkout. p_plate or p_id.
create or replace function parking_lookup(p_plate text, p_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.parking_sessions%rowtype;
  v_members jsonb;
begin
  if not is_staff() then raise exception 'Parking is for staff accounts.'; end if;
  if p_id is not null then
    select * into s from public.parking_sessions where id = p_id and exited_at is null;
  else
    select * into s from public.parking_sessions where plate = bnb_plate(p_plate) and exited_at is null;
  end if;
  if not found then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', m.member_id, 'name', m.full_name, 'checked_in', m.checked_in)), '[]'::jsonb)
    into v_members from bnb_plate_members(s.plate, s.entered_at) m;
  return jsonb_build_object(
    'id', s.id, 'plate', s.plate, 'entered_at', s.entered_at,
    'fee', bnb_parking_fee(s.entered_at, now()),
    'paybill', (select paybill from public.parking_settings where id = 1),
    'members', v_members);
end;
$$;

-- p_outcome: 'mpesa', 'cash' or 'exempt' (needs p_member).
create or replace function parking_checkout(p_id uuid, p_outcome text, p_ref text default null, p_member uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.parking_sessions%rowtype;
  v_fee numeric;
begin
  if not is_staff() then raise exception 'Parking is for staff accounts.'; end if;
  select * into s from public.parking_sessions where id = p_id and exited_at is null for update;
  if not found then raise exception 'That car has already been checked out.'; end if;
  if p_outcome not in ('mpesa', 'cash', 'exempt') then raise exception 'Unknown payment type.'; end if;
  v_fee := bnb_parking_fee(s.entered_at, now());
  if p_outcome = 'exempt' then
    if not exists (select 1 from bnb_plate_members(s.plate, s.entered_at) m where m.member_id = p_member and m.checked_in) then
      raise exception 'Only a member with this plate on their profile who checked in today parks free.';
    end if;
    v_fee := 0;
  end if;
  update public.parking_sessions
     set exited_at = now(), exited_by = my_user_id(), outcome = p_outcome, fee = v_fee,
         mpesa_ref = nullif(upper(trim(coalesce(p_ref, ''))), ''),
         member_id = case when p_outcome = 'exempt' then p_member end
   where id = s.id;
  return jsonb_build_object('plate', s.plate, 'outcome', p_outcome, 'fee', v_fee);
end;
$$;

-- A plate typed wrong at the gate: remove the stay entirely.
create or replace function parking_cancel(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_staff() then raise exception 'Parking is for staff accounts.'; end if;
  delete from public.parking_sessions where id = p_id and exited_at is null;
end;
$$;

revoke all on function parking_enter(text) from public, anon;
revoke all on function parking_lookup(text, uuid) from public, anon;
revoke all on function parking_checkout(uuid, text, text, uuid) from public, anon;
revoke all on function parking_cancel(uuid) from public, anon;
grant execute on function parking_enter(text) to authenticated;
grant execute on function parking_lookup(text, uuid) to authenticated;
grant execute on function parking_checkout(uuid, text, text, uuid) to authenticated;
grant execute on function parking_cancel(uuid) to authenticated;
