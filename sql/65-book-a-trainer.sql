-- ============================================================
-- BOOK A TRAINER: COACH PROFILES + NOTES ON 1-ON-1s
-- Run after 64-switch-booking.sql. Safe to re-run.
--
-- 1. coach_profiles: a short bio and specialties per coach, shown to
--    members in Book a Trainer. Anyone signed in can read them; a coach
--    edits their own, admins/staff anyone's. (The photo is the coach's
--    account photo, users.avatar.)
--
-- 2. Notes on a 1-on-1 ("What do you want to work on?"):
--      book_pt_slot() takes an optional p_notes (same rules as sql/42
--        otherwise — credit, overlap, future slot, row lock)
--      set_pt_booking_notes() lets the member change it later (until
--        the session starts), or staff any time
--    The coach's "booked a 1-on-1" notification includes the note.
-- ============================================================

-- ---------------- Coach profiles ----------------
create table if not exists public.coach_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  bio text not null default '' check (char_length(bio) <= 800),
  specialties text[] not null default '{}' check (coalesce(array_length(specialties, 1), 0) <= 12),
  updated_at timestamptz not null default now()
);

alter table public.coach_profiles enable row level security;

drop policy if exists "coach profiles: anyone signed in reads" on public.coach_profiles;
create policy "coach profiles: anyone signed in reads" on public.coach_profiles
  for select to authenticated using (true);

drop policy if exists "coach profiles: own or staff writes" on public.coach_profiles;
create policy "coach profiles: own or staff writes" on public.coach_profiles
  for all to authenticated
  using (is_staff() and (user_id = my_user_id() or exists (
    select 1 from public.users where id = my_user_id() and roles && array['admin','staff']::text[])))
  with check (is_staff() and (user_id = my_user_id() or exists (
    select 1 from public.users where id = my_user_id() and roles && array['admin','staff']::text[])));

grant select, insert, update, delete on public.coach_profiles to authenticated;
revoke all on public.coach_profiles from anon;

-- ---------------- Book with a note ----------------
-- Same as sql/42's book_pt_slot plus p_notes. The old two-argument
-- version is dropped so calls stay unambiguous; existing calls without
-- a note still work through the default.
drop function if exists book_pt_slot(uuid, uuid);
create or replace function book_pt_slot(p_slot_id uuid, p_member_id uuid default null, p_notes text default null)
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
  v_notes text := nullif(left(trim(coalesce(p_notes, '')), 500), '');
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;
  if v_member <> caller and not is_staff() then
    raise exception 'You can only book sessions for yourself.';
  end if;

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

  insert into public.pt_bookings (slot_id, trainer_id, user_id, status, credit_used, notes)
  values (p_slot_id, v_slot.trainer_id, v_member, 'confirmed', true, v_notes);

  update public.slots set status = 'booked' where id = p_slot_id;

  perform set_config('bnb.system_write', 'on', true);
  update public.users set credits = v_credits - 1 where id = v_member;
  perform set_config('bnb.system_write', 'off', true);

  return v_credits - 1;
end;
$$;

revoke execute on function book_pt_slot(uuid, uuid, text) from public, anon;
grant execute on function book_pt_slot(uuid, uuid, text) to authenticated;

-- ---------------- Change the note later ----------------
create or replace function set_pt_booking_notes(p_booking_id uuid, p_notes text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_staff boolean := is_staff();
  v_pt public.pt_bookings%rowtype;
  v_start timestamp;
begin
  if caller is null then raise exception 'Not signed in.'; end if;
  select * into v_pt from public.pt_bookings where id = p_booking_id for update;
  if not found or (v_pt.user_id <> caller and not v_staff) then raise exception 'Booking not found.'; end if;
  if v_pt.status <> 'confirmed' then raise exception 'That 1-on-1 is cancelled.'; end if;
  select s.date + s.start_time into v_start from public.slots s where s.id = v_pt.slot_id;
  if not v_staff and v_start <= gym_local_now() then raise exception 'That session has already started.'; end if;
  update public.pt_bookings set notes = nullif(left(trim(coalesce(p_notes, '')), 500), '') where id = p_booking_id;
end;
$$;

revoke execute on function set_pt_booking_notes(uuid, text) from public, anon;
grant execute on function set_pt_booking_notes(uuid, text) to authenticated;

-- ---------------- Coach notification includes the note ----------------
-- Same as sql/62 apart from the note on a new booking.
create or replace function notify_pt_booking_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := my_user_id();
  v_when text;
  v_name text;
  v_coach_name text;
  v_note text := '';
begin
  select to_char(s.date, 'FMDy FMDD FMMon') || ' at ' || to_char(s.date + s.start_time, 'FMHH12:MI AM')
    into v_when from public.slots s where s.id = new.slot_id;
  v_when := coalesce(v_when, 'a date to be confirmed');
  select coalesce(full_name, 'A member') into v_name from public.users where id = new.user_id;
  select coalesce(full_name, 'your coach') into v_coach_name from public.users where id = new.trainer_id;
  if coalesce(new.notes, '') <> '' then
    v_note := ' Wants to work on: "' || left(new.notes, 140) || case when char_length(new.notes) > 140 then '…' else '' end || '"';
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'confirmed' then return new; end if;
    if new.trainer_id is distinct from actor then
      insert into public.notifications (user_id, type, message, link_tab)
      values (new.trainer_id, 'pt_booked', v_name || ' booked a 1-on-1 with you on ' || v_when || '.' || v_note, 'roster');
    end if;
    if new.user_id is distinct from actor then
      insert into public.notifications (user_id, type, message, link_tab)
      values (new.user_id, 'pt_booked', 'You''re booked for a 1-on-1 with ' || v_coach_name || ' on ' || v_when || '.', 'schedule');
    end if;

  elsif old.status = 'confirmed' and new.status = 'cancelled' then
    if new.trainer_id is distinct from actor then
      insert into public.notifications (user_id, type, message, link_tab)
      values (new.trainer_id, 'pt_cancelled',
              case when new.user_id = actor then v_name || ' cancelled their 1-on-1 with you on '
                   else 'The gym cancelled ' || v_name || '''s 1-on-1 with you on ' end || v_when || '.',
              'roster');
    end if;
    if new.user_id is distinct from actor then
      insert into public.notifications (user_id, type, message, link_tab)
      values (new.user_id, 'pt_cancelled',
              'Your 1-on-1 with ' || v_coach_name || ' on ' || v_when || ' was cancelled'
              || case when new.credit_used then ' — your credit has been refunded.' else '.' end,
              'schedule');
    end if;
  end if;
  return new;
end;
$$;
