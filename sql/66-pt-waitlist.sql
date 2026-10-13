-- ============================================================
-- 1-ON-1 WAITLIST
-- Run after 65-book-a-trainer.sql. Safe to re-run.
--
-- Members can wait for a 1-on-1 slot someone else has booked. When it
-- opens again (the booking is cancelled, or moved to another time), the
-- longest-waiting member is booked straight in — 1 credit, their note
-- kept — and told. Someone with no credits, or already in a 1-on-1 that
-- overlaps, is skipped (and told why), and it goes to the next person.
--
--   pt_waitlist              who's waiting for which slot
--   join_pt_waitlist()       join (yourself; staff for a member)
--   leave_pt_waitlist()      leave
--   pt_waitlist_counts()     how many wait per slot + your place
--   promote_pt_waitlist()    fills an open slot from its waitlist —
--                            runs from a trigger whenever a slot goes
--                            from booked back to open, so every path
--                            (cancel, member switch, staff edit) is covered
-- ============================================================

create table if not exists public.pt_waitlist (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.slots(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  notes text check (char_length(notes) <= 500),
  status text not null default 'waiting' check (status in ('waiting', 'booked', 'left', 'skipped')),
  created_at timestamptz not null default now()
);
create unique index if not exists pt_waitlist_one_waiting on public.pt_waitlist(slot_id, user_id) where status = 'waiting';
create index if not exists idx_pt_waitlist_slot on public.pt_waitlist(slot_id, created_at) where status = 'waiting';

alter table public.pt_waitlist enable row level security;
drop policy if exists "pt waitlist: own or staff reads" on public.pt_waitlist;
create policy "pt waitlist: own or staff reads" on public.pt_waitlist
  for select to authenticated using (user_id = my_user_id() or is_staff());
-- No write policies: changes go through the functions below.
grant select on public.pt_waitlist to authenticated;
revoke all on public.pt_waitlist from anon;

-- ---------------- Join / leave ----------------
create or replace function join_pt_waitlist(p_slot_id uuid, p_member_id uuid default null, p_notes text default null)
returns integer  -- your place in the queue
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_member uuid := coalesce(p_member_id, caller);
  v_slot public.slots%rowtype;
  v_place integer;
begin
  if caller is null then raise exception 'Not signed in.'; end if;
  if v_member <> caller and not is_staff() then raise exception 'You can only join a waitlist for yourself.'; end if;

  select * into v_slot from public.slots where id = p_slot_id for update;
  if not found then raise exception 'That slot no longer exists.'; end if;
  if v_slot.date + v_slot.start_time <= gym_local_now() then raise exception 'That slot has already started.'; end if;
  if v_slot.status = 'open' then raise exception 'That slot is free — book it instead.'; end if;
  if v_slot.status = 'blocked' then raise exception 'That slot isn''t available.'; end if;
  if exists (select 1 from public.pt_bookings where slot_id = p_slot_id and user_id = v_member and status = 'confirmed') then
    raise exception 'You''re already booked in that slot.';
  end if;
  if exists (select 1 from public.pt_waitlist where slot_id = p_slot_id and user_id = v_member and status = 'waiting') then
    raise exception 'You''re already on that waitlist.';
  end if;

  insert into public.pt_waitlist (slot_id, user_id, notes)
  values (p_slot_id, v_member, nullif(left(trim(coalesce(p_notes, '')), 500), ''));
  select count(*) into v_place from public.pt_waitlist where slot_id = p_slot_id and status = 'waiting';
  return v_place;
end;
$$;

create or replace function leave_pt_waitlist(p_slot_id uuid, p_member_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_member uuid := coalesce(p_member_id, caller);
begin
  if caller is null then raise exception 'Not signed in.'; end if;
  if v_member <> caller and not is_staff() then raise exception 'You can only leave a waitlist for yourself.'; end if;
  update public.pt_waitlist set status = 'left'
  where slot_id = p_slot_id and user_id = v_member and status = 'waiting';
  if not found then raise exception 'You''re not on that waitlist.'; end if;
end;
$$;

-- Everyone sees how many are waiting (not who); you also get your place.
create or replace function pt_waitlist_counts()
returns table(slot_id uuid, waiting integer, my_place integer)
language sql
stable
security definer
set search_path = public
as $$
  with w as (
    select w.slot_id, w.user_id, row_number() over (partition by w.slot_id order by w.created_at, w.id) as place
    from public.pt_waitlist w
    join public.slots s on s.id = w.slot_id
    where w.status = 'waiting' and s.date >= gym_local_now()::date
  )
  select slot_id, count(*)::integer, (max(place) filter (where user_id = my_user_id()))::integer
  from w group by slot_id;
$$;

-- ---------------- Fill an open slot from its waitlist ----------------
create or replace function promote_pt_waitlist(p_slot_id uuid)
returns boolean  -- true if someone was booked in
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.slots%rowtype;
  w record;
  v_credits integer;
  v_when text;
  v_coach text;
begin
  select * into v_slot from public.slots where id = p_slot_id;
  if not found or v_slot.status <> 'open' or v_slot.date + v_slot.start_time <= gym_local_now() then return false; end if;
  if exists (select 1 from public.pt_bookings where slot_id = p_slot_id and status = 'confirmed') then return false; end if;
  v_when := bnb_when(v_slot.date, v_slot.start_time);
  select coalesce(full_name, 'your coach') into v_coach from public.users where id = v_slot.trainer_id;

  for w in select * from public.pt_waitlist where slot_id = p_slot_id and status = 'waiting' order by created_at, id for update loop
    select coalesce(credits, 0) into v_credits from public.users where id = w.user_id for update;
    if coalesce(v_credits, 0) < 1 then
      update public.pt_waitlist set status = 'skipped' where id = w.id;
      insert into public.notifications (user_id, type, message, link_tab)
      values (w.user_id, 'pt_cancelled', 'A 1-on-1 with ' || v_coach || ' on ' || v_when
              || ' opened up, but you had no credits left, so it went to the next person.', 'schedule');
      continue;
    end if;
    if exists (
      select 1 from public.pt_bookings p join public.slots s on s.id = p.slot_id
      where p.user_id = w.user_id and p.status = 'confirmed' and s.date = v_slot.date
        and s.start_time < v_slot.start_time + make_interval(mins => coalesce(v_slot.duration, 60))
        and v_slot.start_time < s.start_time + make_interval(mins => coalesce(s.duration, 60))
    ) then
      update public.pt_waitlist set status = 'skipped' where id = w.id;
      insert into public.notifications (user_id, type, message, link_tab)
      values (w.user_id, 'pt_cancelled', 'A 1-on-1 with ' || v_coach || ' on ' || v_when
              || ' opened up, but you already have a 1-on-1 then, so it went to the next person.', 'schedule');
      continue;
    end if;

    -- The member gets one "you're in" note below instead of the
    -- trigger's generic one (the coach still gets theirs, with the note).
    perform set_config('bnb.pt_quiet_member', 'on', true);
    insert into public.pt_bookings (slot_id, trainer_id, user_id, status, credit_used, notes)
    values (p_slot_id, v_slot.trainer_id, w.user_id, 'confirmed', true, w.notes);
    perform set_config('bnb.pt_quiet_member', 'off', true);
    update public.slots set status = 'booked' where id = p_slot_id;
    perform set_config('bnb.system_write', 'on', true);
    update public.users set credits = v_credits - 1 where id = w.user_id;
    perform set_config('bnb.system_write', 'off', true);
    update public.pt_waitlist set status = 'booked' where id = w.id;
    insert into public.notifications (user_id, type, message, link_tab)
    values (w.user_id, 'waitlist_promoted', 'A spot opened up — you''re booked for a 1-on-1 with ' || v_coach || ' on ' || v_when
            || '. 1 credit used.', 'schedule');
    return true;
  end loop;
  return false;
end;
$$;

create or replace function trg_slot_reopened()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'booked' and new.status = 'open' then
    perform promote_pt_waitlist(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_slot_reopened on public.slots;
create trigger trg_slot_reopened
  after update of status on public.slots
  for each row execute function trg_slot_reopened();

-- Same as sql/65 apart from staying quiet to the member when the
-- waitlist books them in (they get their own message).
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
      values (new.trainer_id, 'pt_booked', v_name || ' booked a 1-on-1 with you on ' || v_when
              || case when current_setting('bnb.pt_quiet_member', true) = 'on' then ' (from the waitlist)' else '' end
              || '.' || v_note, 'roster');
    end if;
    if new.user_id is distinct from actor and coalesce(current_setting('bnb.pt_quiet_member', true), '') <> 'on' then
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

revoke execute on function promote_pt_waitlist(uuid) from public, anon, authenticated;
revoke execute on function join_pt_waitlist(uuid, uuid, text) from public, anon;
revoke execute on function leave_pt_waitlist(uuid, uuid) from public, anon;
revoke execute on function pt_waitlist_counts() from public, anon;
grant execute on function join_pt_waitlist(uuid, uuid, text) to authenticated;
grant execute on function leave_pt_waitlist(uuid, uuid) to authenticated;
grant execute on function pt_waitlist_counts() to authenticated;
