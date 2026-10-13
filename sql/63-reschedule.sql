-- ============================================================
-- RESCHEDULE CLASSES AND 1-ON-1s (calendar drag and drop)
-- Run after 62-class-booking.sql. Safe to re-run.
--
-- reschedule_class_session()  move a class to another date/time
-- reschedule_pt_slot()        move a 1-on-1 slot (booked or not)
--
-- Staff only (coaches are staff). Bookings stay with the class / slot;
-- everyone booked (and the coach, if someone else moved it) is
-- notified, and their 24-hour reminder is re-armed for the new time.
--
-- A recurring class's session that's moved becomes a one-off, and a
-- cancelled placeholder is left at its old time so
-- ensure_class_sessions() (sql/62) doesn't recreate it there.
-- ============================================================

create or replace function bnb_when(p_date date, p_time time)
returns text
language sql
immutable
as $$
  select to_char(p_date, 'FMDy FMDD FMMon') || ' at ' || to_char(p_date + p_time, 'FMHH12:MI AM');
$$;

create or replace function reschedule_class_session(p_session_id uuid, p_date date, p_time time)
returns integer  -- how many people were told
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := my_user_id();
  v_s public.class_sessions%rowtype;
  v_name text;
  v_coach uuid;
  v_old text;
  v_new text;
  n integer;
begin
  if not is_staff() then raise exception 'Only staff can move classes.'; end if;
  if p_date is null or p_time is null then raise exception 'Pick a date and time.'; end if;

  select * into v_s from public.class_sessions where id = p_session_id for update;
  if not found then raise exception 'That class no longer exists.'; end if;
  if coalesce(v_s.status, 'scheduled') <> 'scheduled' then raise exception 'That class has been cancelled.'; end if;
  if v_s.date + v_s.start_time <= gym_local_now() then raise exception 'That class has already started.'; end if;
  if p_date + p_time <= gym_local_now() then raise exception 'Pick a time in the future.'; end if;
  if p_date = v_s.date and p_time = v_s.start_time then return 0; end if;
  if exists (select 1 from public.class_sessions
             where class_id = v_s.class_id and date = p_date and start_time = p_time
               and id <> p_session_id and coalesce(status, 'scheduled') = 'scheduled') then
    raise exception 'This class already runs at that time.';
  end if;

  select c.name, coalesce(v_s.instructor_id, c.instructor_id) into v_name, v_coach
  from public.classes c where c.id = v_s.class_id;
  v_name := coalesce(v_name, 'Class');
  v_old := bnb_when(v_s.date, v_s.start_time);
  v_new := bnb_when(p_date, p_time);

  if v_s.auto and not exists (select 1 from public.class_sessions
                              where class_id = v_s.class_id and date = v_s.date and start_time = v_s.start_time
                                and id <> p_session_id) then
    insert into public.class_sessions (class_id, date, start_time, instructor_id, status, auto)
    values (v_s.class_id, v_s.date, v_s.start_time, v_s.instructor_id, 'cancelled', true);
  end if;

  update public.class_sessions set date = p_date, start_time = p_time, auto = false where id = p_session_id;
  update public.bookings set reminded_at = null
  where session_id = p_session_id and status in ('confirmed', 'waitlisted');

  insert into public.notifications (user_id, type, message, link_tab)
  select user_id, 'class_moved', v_name || ' on ' || v_old || ' has moved to ' || v_new || '.', 'schedule'
  from public.bookings
  where session_id = p_session_id and status in ('confirmed', 'waitlisted') and user_id is distinct from actor;
  get diagnostics n = row_count;

  if v_coach is not null and v_coach is distinct from actor then
    insert into public.notifications (user_id, type, message, link_tab)
    values (v_coach, 'class_moved', 'Your ' || v_name || ' on ' || v_old || ' has moved to ' || v_new || '.', 'roster');
  end if;
  return n;
end;
$$;

create or replace function reschedule_pt_slot(p_slot_id uuid, p_date date, p_time time)
returns integer  -- 1 if a booked member was told
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := my_user_id();
  v_sl public.slots%rowtype;
  v_pt public.pt_bookings%rowtype;
  v_coach_name text;
  v_member_name text;
  v_old text;
  v_new text;
  n integer := 0;
begin
  if not is_staff() then raise exception 'Only staff can move 1-on-1s.'; end if;
  if p_date is null or p_time is null then raise exception 'Pick a date and time.'; end if;

  select * into v_sl from public.slots where id = p_slot_id for update;
  if not found then raise exception 'That slot no longer exists.'; end if;
  if v_sl.date + v_sl.start_time <= gym_local_now() then raise exception 'That 1-on-1 has already started.'; end if;
  if p_date + p_time <= gym_local_now() then raise exception 'Pick a time in the future.'; end if;
  if p_date = v_sl.date and p_time = v_sl.start_time then return 0; end if;
  if exists (
    select 1 from public.slots s
    where s.trainer_id = v_sl.trainer_id and s.id <> p_slot_id and s.date = p_date and s.status <> 'blocked'
      and s.start_time < p_time + make_interval(mins => coalesce(v_sl.duration, 60))
      and p_time < s.start_time + make_interval(mins => coalesce(s.duration, 60))
  ) then
    raise exception 'That overlaps another of this coach''s slots.';
  end if;

  select * into v_pt from public.pt_bookings where slot_id = p_slot_id and status = 'confirmed' limit 1;
  if found and exists (
    select 1 from public.pt_bookings p join public.slots s on s.id = p.slot_id
    where p.user_id = v_pt.user_id and p.status = 'confirmed' and p.slot_id <> p_slot_id and s.date = p_date
      and s.start_time < p_time + make_interval(mins => coalesce(v_sl.duration, 60))
      and p_time < s.start_time + make_interval(mins => coalesce(s.duration, 60))
  ) then
    raise exception 'The member already has a 1-on-1 at that time.';
  end if;

  v_old := bnb_when(v_sl.date, v_sl.start_time);
  v_new := bnb_when(p_date, p_time);
  update public.slots set date = p_date, start_time = p_time where id = p_slot_id;

  if v_pt.id is not null then
    update public.pt_bookings set reminded_at = null where id = v_pt.id;
    select coalesce(full_name, 'your coach') into v_coach_name from public.users where id = v_sl.trainer_id;
    select coalesce(full_name, 'A member') into v_member_name from public.users where id = v_pt.user_id;
    if v_pt.user_id is distinct from actor then
      insert into public.notifications (user_id, type, message, link_tab)
      values (v_pt.user_id, 'pt_moved', 'Your 1-on-1 with ' || v_coach_name || ' on ' || v_old || ' has moved to ' || v_new || '.', 'schedule');
      n := 1;
    end if;
    if v_sl.trainer_id is distinct from actor then
      insert into public.notifications (user_id, type, message, link_tab)
      values (v_sl.trainer_id, 'pt_moved', v_member_name || '''s 1-on-1 on ' || v_old || ' has moved to ' || v_new || '.', 'roster');
    end if;
  end if;
  return n;
end;
$$;

revoke execute on function reschedule_class_session(uuid, date, time) from public, anon;
revoke execute on function reschedule_pt_slot(uuid, date, time) from public, anon;
grant execute on function reschedule_class_session(uuid, date, time) to authenticated;
grant execute on function reschedule_pt_slot(uuid, date, time) to authenticated;
