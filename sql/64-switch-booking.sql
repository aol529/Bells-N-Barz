-- ============================================================
-- MEMBERS SWITCH THEIR OWN BOOKING (member calendar drag and drop)
-- Run after 63-reschedule.sql. Safe to re-run.
--
-- switch_class_booking()  move my booked class spot to another session
--                         of the same class (not a waitlist place)
-- switch_pt_booking()     move my 1-on-1 to another open slot
--
-- One step on the server, so nobody loses their spot halfway through a
-- cancel-and-rebook. The booking row itself moves (same id; a 1-on-1
-- keeps whatever credit it used), so there's no cancellation and no
-- credit change. The target must have room: a full class is refused
-- rather than putting you on its waitlist. A spot freed in the old class
-- goes to its waitlist (sql/62). The coach is told; the 24-hour reminder
-- is re-armed for the new time. Members switch their own; staff anyone's.
-- ============================================================

create or replace function switch_class_booking(p_booking_id uuid, p_session_id uuid)
returns text  -- 'confirmed'
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_staff boolean := is_staff();
  v_b public.bookings%rowtype;
  v_from public.class_sessions%rowtype;
  v_to public.class_sessions%rowtype;
  v_coach uuid;
  v_name text;
  v_member text;
begin
  if caller is null then raise exception 'Not signed in.'; end if;
  select * into v_b from public.bookings where id = p_booking_id;
  if not found or (v_b.user_id <> caller and not v_staff) then raise exception 'Booking not found.'; end if;
  if v_b.session_id = p_session_id then return v_b.status; end if;

  -- Lock both sessions in a fixed order so two switches can't deadlock.
  perform 1 from public.class_sessions where id in (v_b.session_id, p_session_id) order by id for update;
  select * into v_from from public.class_sessions where id = v_b.session_id;
  select * into v_to from public.class_sessions where id = p_session_id;
  select * into v_b from public.bookings where id = p_booking_id for update;

  if v_b.status = 'waitlisted' then raise exception 'You''re on the waitlist for that one — leave it and book another time instead.'; end if;
  if v_b.status <> 'confirmed' then raise exception 'That booking is already cancelled.'; end if;
  if v_to.id is null then raise exception 'That class no longer exists.'; end if;
  if v_to.class_id is distinct from v_from.class_id then raise exception 'You can only switch to another time of the same class.'; end if;
  if coalesce(v_to.status, 'scheduled') <> 'scheduled' then raise exception 'That class has been cancelled.'; end if;
  if v_to.date + v_to.start_time <= gym_local_now() then raise exception 'That class has already started.'; end if;
  if not v_staff and v_from.date + v_from.start_time <= gym_local_now() then
    raise exception 'Your class has already started — ask your coach if you need to change it.';
  end if;
  if exists (select 1 from public.bookings where session_id = p_session_id and user_id = v_b.user_id
             and status in ('confirmed', 'waitlisted')) then
    raise exception 'You''re already booked on that one.';
  end if;
  if (select count(*) from public.bookings where session_id = p_session_id and status = 'confirmed')
     >= class_session_capacity(p_session_id) then
    raise exception 'That class is full — pick another time.';
  end if;

  -- Only session_id/booked_at change, so the status trigger (sql/62)
  -- doesn't fire; the coach gets one "moved" note below instead.
  update public.bookings set session_id = p_session_id, booked_at = now(), reminded_at = null
  where id = p_booking_id;
  perform promote_class_waitlist(v_from.id);

  select c.name, coalesce(v_to.instructor_id, c.instructor_id) into v_name, v_coach from public.classes c where c.id = v_to.class_id;
  select coalesce(full_name, 'A member') into v_member from public.users where id = v_b.user_id;
  if v_coach is not null and v_coach is distinct from caller then
    insert into public.notifications (user_id, type, message, link_tab)
    values (v_coach, 'class_moved', v_member || ' moved from ' || coalesce(v_name, 'class') || ' on '
            || bnb_when(v_from.date, v_from.start_time) || ' to ' || bnb_when(v_to.date, v_to.start_time) || '.', 'roster');
  end if;
  if v_b.user_id <> caller then
    insert into public.notifications (user_id, type, message, link_tab)
    values (v_b.user_id, 'class_moved', 'You''ve been moved to ' || class_session_label(p_session_id) || '.', 'schedule');
  end if;
  return 'confirmed';
end;
$$;

create or replace function switch_pt_booking(p_booking_id uuid, p_slot_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_staff boolean := is_staff();
  v_pt public.pt_bookings%rowtype;
  v_from public.slots%rowtype;
  v_to public.slots%rowtype;
  v_member text;
  v_old_coach text;
  v_new_coach text;
begin
  if caller is null then raise exception 'Not signed in.'; end if;
  select * into v_pt from public.pt_bookings where id = p_booking_id;
  if not found or (v_pt.user_id <> caller and not v_staff) then raise exception 'Booking not found.'; end if;
  if v_pt.slot_id = p_slot_id then return true; end if;

  perform 1 from public.slots where id in (v_pt.slot_id, p_slot_id) order by id for update;
  select * into v_from from public.slots where id = v_pt.slot_id;
  select * into v_to from public.slots where id = p_slot_id;
  select * into v_pt from public.pt_bookings where id = p_booking_id for update;

  if v_pt.status <> 'confirmed' then raise exception 'That 1-on-1 is already cancelled.'; end if;
  if v_to.id is null then raise exception 'That slot no longer exists.'; end if;
  if v_to.status <> 'open' or exists (select 1 from public.pt_bookings where slot_id = p_slot_id and status = 'confirmed') then
    raise exception 'That slot is no longer available.';
  end if;
  if v_to.date + v_to.start_time <= gym_local_now() then raise exception 'That slot has already started.'; end if;
  if not v_staff and v_from.date + v_from.start_time <= gym_local_now() then
    raise exception 'Your 1-on-1 has already started — ask your coach if you need to change it.';
  end if;
  if exists (
    select 1 from public.pt_bookings p join public.slots s on s.id = p.slot_id
    where p.user_id = v_pt.user_id and p.status = 'confirmed' and p.id <> p_booking_id and s.date = v_to.date
      and s.start_time < v_to.start_time + make_interval(mins => coalesce(v_to.duration, 60))
      and v_to.start_time < s.start_time + make_interval(mins => coalesce(s.duration, 60))
  ) then
    raise exception 'You already have a 1-on-1 that overlaps that time.';
  end if;

  -- The booking row moves (keeping credit_used), so no cancel and no
  -- credit change; status is untouched, so the sql/62 trigger stays quiet.
  update public.pt_bookings set slot_id = p_slot_id, trainer_id = v_to.trainer_id, reminded_at = null where id = p_booking_id;
  update public.slots set status = 'open' where id = v_from.id and status = 'booked';
  update public.slots set status = 'booked' where id = p_slot_id;

  select coalesce(full_name, 'A member') into v_member from public.users where id = v_pt.user_id;
  select coalesce(full_name, 'your coach') into v_old_coach from public.users where id = v_from.trainer_id;
  select coalesce(full_name, 'your coach') into v_new_coach from public.users where id = v_to.trainer_id;
  if v_from.trainer_id = v_to.trainer_id then
    if v_to.trainer_id is distinct from caller then
      insert into public.notifications (user_id, type, message, link_tab)
      values (v_to.trainer_id, 'pt_moved', v_member || ' moved their 1-on-1 from ' || bnb_when(v_from.date, v_from.start_time)
              || ' to ' || bnb_when(v_to.date, v_to.start_time) || '.', 'roster');
    end if;
  else
    if v_from.trainer_id is distinct from caller then
      insert into public.notifications (user_id, type, message, link_tab)
      values (v_from.trainer_id, 'pt_cancelled', v_member || ' moved their 1-on-1 on ' || bnb_when(v_from.date, v_from.start_time)
              || ' to another coach. That slot is open again.', 'roster');
    end if;
    if v_to.trainer_id is distinct from caller then
      insert into public.notifications (user_id, type, message, link_tab)
      values (v_to.trainer_id, 'pt_booked', v_member || ' booked a 1-on-1 with you on ' || bnb_when(v_to.date, v_to.start_time) || '.', 'roster');
    end if;
  end if;
  if v_pt.user_id <> caller then
    insert into public.notifications (user_id, type, message, link_tab)
    values (v_pt.user_id, 'pt_moved', 'Your 1-on-1 has moved to ' || bnb_when(v_to.date, v_to.start_time) || ' with ' || v_new_coach || '.', 'schedule');
  end if;
  return true;
end;
$$;

revoke execute on function switch_class_booking(uuid, uuid) from public, anon;
revoke execute on function switch_pt_booking(uuid, uuid) from public, anon;
grant execute on function switch_class_booking(uuid, uuid) to authenticated;
grant execute on function switch_pt_booking(uuid, uuid) to authenticated;
