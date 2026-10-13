-- ============================================================
-- CLASS BOOKING, WAITLIST, RECURRING CLASSES, BOOKING ALERTS
-- Run after 61-coach-workouts.sql. Safe to re-run.
--
-- 1. Class booking goes through the server, like 1-on-1s (sql/42).
--    Members can only read their own bookings, so the app couldn't
--    count a class's other bookings: every class looked nearly empty
--    to a member, and anyone could book past capacity. Now:
--      book_class()           capacity is checked here, row-locked, so
--                             two people can't take the last spot
--      cancel_class_booking() member (before the start) or staff
--      class_session_counts() booked / waitlisted per session, plus
--                             your own waitlist place, for everyone
--    Members can no longer insert or update bookings directly.
--
-- 2. Waitlist moves up on its own: when a confirmed spot is cancelled,
--    the longest-waiting person is booked in and told.
--
-- 3. Recurring classes: a class's "Recurring" text (e.g.
--    "Mon/Wed/Fri 06:00", "Tue-Thu 5:30pm", "Weekdays 07:00, Sat 09:00")
--    now creates its sessions 3 weeks ahead — ensure_class_sessions(),
--    which the app calls when Booking opens. Generated sessions are
--    marked auto; if the class's times change or it's archived, future
--    auto sessions nobody has booked are removed. Booked ones are kept
--    for staff to cancel. One-off sessions made by hand are never
--    touched.
--
-- 4. Notifications (the bell):
--      coach   a member books, joins the waitlist or cancels (class
--              or 1-on-1)
--      member  staff book/cancel for them, a class is cancelled, they
--              come off the waitlist, and a reminder within 24h of
--              each class and 1-on-1 (send_booking_reminders()).
--    Reminders are sent every 15 minutes if pg_cron is available (this
--    file tries to turn it on), and also whenever anyone opens the app.
-- ============================================================

alter table public.class_sessions add column if not exists auto boolean not null default false;
alter table public.bookings add column if not exists reminded_at timestamptz;
alter table public.pt_bookings add column if not exists reminded_at timestamptz;
create index if not exists idx_bookings_session_id on public.bookings(session_id);
create index if not exists idx_class_sessions_class_date on public.class_sessions(class_id, date);

-- ---------------- Helpers ----------------
-- "Sunrise HIIT on Tue 14 Oct at 6:00 AM"
create or replace function class_session_label(p_session_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(c.name, 'Class') || ' on ' || to_char(s.date, 'FMDy FMDD FMMon')
         || ' at ' || to_char(s.date + s.start_time, 'FMHH12:MI AM')
  from public.class_sessions s
  left join public.classes c on c.id = s.class_id
  where s.id = p_session_id;
$$;

create or replace function class_session_capacity(p_session_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(s.capacity_override, c.capacity, 0)
  from public.class_sessions s
  left join public.classes c on c.id = s.class_id
  where s.id = p_session_id;
$$;

-- Turns a class's Recurring text into (ISO weekday 1=Mon..7=Sun, time)
-- rows. Groups are split on commas/semicolons; each group is days then
-- a time: "Mon/Wed/Fri 06:00", "Tue-Thu 5:30pm", "Daily 7am",
-- "Weekdays 06:00, Sat 09:00". Anything it can't read is skipped.
-- Keep in step with parseRecurring() in js/bells-n-barz-booking-coach.js.
create or replace function recurring_slots(p_text text)
returns table(dow integer, start_time time)
language plpgsql
immutable
as $$
declare
  grp text;
  dpart text;
  m text[];
  r text[];
  hh integer;
  mm integer;
  days integer[];
  a integer;
  b integer;
  i integer;
  names constant text[] := array['mon','tue','wed','thu','fri','sat','sun'];
begin
  if p_text is null or trim(p_text) = '' then return; end if;
  foreach grp in array regexp_split_to_array(lower(p_text), '\s*[,;]\s*') loop
    m := regexp_match(grp, '(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?m?\.?\s*$');
    if m is null then continue; end if;
    hh := m[1]::integer;
    mm := coalesce(m[2], '0')::integer;
    if m[3] = 'p' and hh < 12 then hh := hh + 12; end if;
    if m[3] = 'a' and hh = 12 then hh := 0; end if;
    if hh > 23 or mm > 59 then continue; end if;

    dpart := regexp_replace(grp, '\d.*$', '');
    days := '{}';
    if dpart ~ '(daily|every ?day)' then days := array[1,2,3,4,5,6,7]; end if;
    if dpart ~ 'weekday' then days := days || array[1,2,3,4,5]; end if;
    if dpart ~ 'weekend' then days := days || array[6,7]; end if;
    for r in select regexp_matches(dpart, '(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*(?:-|–|to)\s*(mon|tue|wed|thu|fri|sat|sun)', 'g') loop
      a := array_position(names, r[1]);
      b := array_position(names, r[2]);
      i := a;
      loop
        days := days || i;
        exit when i = b;
        i := i % 7 + 1;
      end loop;
    end loop;
    dpart := regexp_replace(dpart, '(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*(?:-|–|to)\s*(mon|tue|wed|thu|fri|sat|sun)[a-z]*', ' ', 'g');
    for r in select regexp_matches(dpart, '(mon|tue|wed|thu|fri|sat|sun)', 'g') loop
      days := days || array_position(names, r[1]);
    end loop;

    return query select distinct d, make_time(hh, mm, 0) from unnest(days) d;
  end loop;
end;
$$;

-- ---------------- Counts ----------------
-- Everyone can see how full a class is (not who's in it).
create or replace function class_session_counts()
returns table(session_id uuid, confirmed integer, waitlisted integer, my_place integer)
language sql
stable
security definer
set search_path = public
as $$
  with live as (
    select b.session_id, b.user_id, b.status,
           row_number() over (partition by b.session_id, b.status order by b.booked_at, b.id) as place
    from public.bookings b
    join public.class_sessions s on s.id = b.session_id
    where s.date >= gym_local_now()::date - 1
      and b.status in ('confirmed', 'waitlisted')
  )
  select session_id,
         (count(*) filter (where status = 'confirmed'))::integer,
         (count(*) filter (where status = 'waitlisted'))::integer,
         (max(place) filter (where status = 'waitlisted' and user_id = my_user_id()))::integer
  from live
  group by session_id;
$$;

-- ---------------- Waitlist ----------------
-- Fills any free spots from the waitlist, longest-waiting first. Only
-- called from inside the functions below (the session row is already
-- locked there). Returns how many were moved up.
create or replace function promote_class_waitlist(p_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sess public.class_sessions%rowtype;
  v_free integer;
  v_moved integer;
begin
  select * into v_sess from public.class_sessions where id = p_session_id;
  if not found or coalesce(v_sess.status, 'scheduled') <> 'scheduled'
     or v_sess.date + v_sess.start_time <= gym_local_now() then
    return 0;
  end if;
  v_free := class_session_capacity(p_session_id)
          - (select count(*) from public.bookings where session_id = p_session_id and status = 'confirmed');
  if v_free <= 0 then return 0; end if;

  update public.bookings set status = 'confirmed'
  where id in (
    select id from public.bookings
    where session_id = p_session_id and status = 'waitlisted'
    order by booked_at, id
    limit v_free
  );
  get diagnostics v_moved = row_count;
  return v_moved;
end;
$$;

-- ---------------- Book ----------------
-- p_member_id lets staff book for a member; anyone else books for
-- themselves. Returns 'confirmed' or 'waitlisted'.
create or replace function book_class(p_session_id uuid, p_member_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_member uuid := coalesce(p_member_id, caller);
  v_sess public.class_sessions%rowtype;
  v_confirmed integer;
  v_status text;
begin
  if caller is null then raise exception 'Not signed in.'; end if;
  if v_member <> caller and not is_staff() then
    raise exception 'You can only book classes for yourself.';
  end if;

  -- Row lock: two people taking the last spot at once are serialized
  -- here, and the second one goes on the waitlist.
  select * into v_sess from public.class_sessions where id = p_session_id for update;
  if not found then raise exception 'That class no longer exists.'; end if;
  if coalesce(v_sess.status, 'scheduled') <> 'scheduled' then
    raise exception 'That class has been cancelled.';
  end if;
  if v_sess.date + v_sess.start_time <= gym_local_now() then
    raise exception 'That class has already started.';
  end if;
  if exists (select 1 from public.bookings
             where session_id = p_session_id and user_id = v_member
               and status in ('confirmed', 'waitlisted')) then
    raise exception 'You''re already booked on that class.';
  end if;

  select count(*) into v_confirmed from public.bookings
  where session_id = p_session_id and status = 'confirmed';
  v_status := case when v_confirmed < class_session_capacity(p_session_id) then 'confirmed' else 'waitlisted' end;

  insert into public.bookings (session_id, user_id, status) values (p_session_id, v_member, v_status);
  return v_status;
end;
$$;

-- ---------------- Cancel ----------------
-- Members cancel their own (before the class starts); staff any.
-- Returns how many people came off the waitlist into the freed spot.
create or replace function cancel_class_booking(p_booking_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_staff boolean := is_staff();
  v_b public.bookings%rowtype;
  v_sess public.class_sessions%rowtype;
begin
  if caller is null then raise exception 'Not signed in.'; end if;

  select * into v_b from public.bookings where id = p_booking_id;
  if not found or (v_b.user_id <> caller and not v_staff) then
    raise exception 'Booking not found.';
  end if;
  -- Same lock order as book_class: session first, then the booking.
  select * into v_sess from public.class_sessions where id = v_b.session_id for update;
  select * into v_b from public.bookings where id = p_booking_id for update;
  if v_b.status not in ('confirmed', 'waitlisted') then
    raise exception 'That booking is already cancelled.';
  end if;
  if not v_staff and v_sess.date + v_sess.start_time <= gym_local_now() then
    raise exception 'That class has already started — ask your coach if you need to change it.';
  end if;

  update public.bookings set status = 'cancelled' where id = p_booking_id;
  if v_b.status = 'confirmed' then
    return promote_class_waitlist(v_b.session_id);
  end if;
  return 0;
end;
$$;

-- Staff raising a session's capacity, or confirming someone by hand,
-- goes through the table directly; this tops the class back up from
-- the waitlist afterwards. Staff only.
create or replace function fill_class_from_waitlist(p_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_staff() then raise exception 'Staff only.'; end if;
  perform 1 from public.class_sessions where id = p_session_id for update;
  return promote_class_waitlist(p_session_id);
end;
$$;

-- ---------------- Recurring classes ----------------
-- Creates each active class's sessions up to p_days ahead from its
-- Recurring text, and tidies future auto sessions that no longer match
-- and that nobody has booked. Returns how many sessions were created.
create or replace function ensure_class_sessions(p_days integer default 21)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp := gym_local_now();
  v_today date := v_now::date;
  n integer;
begin
  perform pg_advisory_xact_lock(hashtext('bnb_ensure_class_sessions'));
  p_days := least(greatest(coalesce(p_days, 21), 1), 60);

  delete from public.class_sessions s
  where s.auto and s.date + s.start_time > v_now
    and not exists (select 1 from public.bookings b where b.session_id = s.id)
    and not exists (
      select 1 from public.classes c
      cross join lateral recurring_slots(c.recurring) r
      where c.id = s.class_id and c.status = 'active'
        and r.dow = extract(isodow from s.date) and r.start_time = s.start_time);

  -- A class's coach changing moves its future auto sessions with it.
  update public.class_sessions s set instructor_id = c.instructor_id
  from public.classes c
  where c.id = s.class_id and s.auto and s.date + s.start_time > v_now
    and s.instructor_id is distinct from c.instructor_id;

  insert into public.class_sessions (class_id, date, start_time, instructor_id, status, auto)
  select c.id, d::date, r.start_time, c.instructor_id, 'scheduled', true
  from public.classes c
  cross join lateral recurring_slots(c.recurring) r
  cross join generate_series(v_today, v_today + p_days, interval '1 day') d
  where c.status = 'active'
    and extract(isodow from d) = r.dow
    and d::date + r.start_time > v_now
    and not exists (select 1 from public.class_sessions s
                    where s.class_id = c.id and s.date = d::date and s.start_time = r.start_time);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------- Notifications ----------------
create or replace function notify_class_booking_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := my_user_id();
  v_coach uuid;
  v_sess_status text;
  v_label text;
  v_name text;
begin
  select coalesce(s.instructor_id, c.instructor_id), s.status into v_coach, v_sess_status
  from public.class_sessions s left join public.classes c on c.id = s.class_id
  where s.id = new.session_id;
  v_label := class_session_label(new.session_id);
  select coalesce(full_name, 'A member') into v_name from public.users where id = new.user_id;

  if tg_op = 'INSERT' then
    if new.status not in ('confirmed', 'waitlisted') then return new; end if;
    if v_coach is not null and v_coach is distinct from actor then
      insert into public.notifications (user_id, type, message, link_tab)
      values (v_coach, 'class_booked',
              v_name || case when new.status = 'confirmed' then ' booked ' else ' joined the waitlist for ' end || v_label || '.',
              'roster');
    end if;
    if new.user_id is distinct from actor then
      insert into public.notifications (user_id, type, message, link_tab)
      values (new.user_id, 'class_booked',
              case when new.status = 'confirmed' then 'You''re booked on ' else 'You''re on the waitlist for ' end || v_label || '.',
              'schedule');
    end if;

  elsif new.status is distinct from old.status then
    if old.status in ('confirmed', 'waitlisted') and new.status = 'cancelled' then
      -- The coach hears when a member drops out themselves (not when
      -- staff cancel a whole class — they did that).
      if new.user_id = actor and v_coach is not null and v_coach is distinct from actor then
        insert into public.notifications (user_id, type, message, link_tab)
        values (v_coach, 'class_cancelled', v_name || ' cancelled their spot on ' || v_label || '.', 'roster');
      end if;
      if new.user_id is distinct from actor then
        insert into public.notifications (user_id, type, message, link_tab)
        values (new.user_id, 'class_cancelled',
                case when v_sess_status = 'cancelled' then v_label || ' has been cancelled by the gym.'
                     else 'Your spot on ' || v_label || ' was cancelled by the gym.' end,
                'schedule');
      end if;
    elsif old.status = 'waitlisted' and new.status = 'confirmed' then
      insert into public.notifications (user_id, type, message, link_tab)
      values (new.user_id, 'waitlist_promoted', 'A spot opened up — you''re now booked on ' || v_label || '.', 'schedule');
      if v_coach is not null and v_coach is distinct from actor then
        insert into public.notifications (user_id, type, message, link_tab)
        values (v_coach, 'class_booked', v_name || ' came off the waitlist for ' || v_label || '.', 'roster');
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_class_booking on public.bookings;
create trigger trg_notify_class_booking
  after insert or update of status on public.bookings
  for each row execute function notify_class_booking_change();

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
begin
  select to_char(s.date, 'FMDy FMDD FMMon') || ' at ' || to_char(s.date + s.start_time, 'FMHH12:MI AM')
    into v_when from public.slots s where s.id = new.slot_id;
  v_when := coalesce(v_when, 'a date to be confirmed');
  select coalesce(full_name, 'A member') into v_name from public.users where id = new.user_id;
  select coalesce(full_name, 'your coach') into v_coach_name from public.users where id = new.trainer_id;

  if tg_op = 'INSERT' then
    if new.status <> 'confirmed' then return new; end if;
    if new.trainer_id is distinct from actor then
      insert into public.notifications (user_id, type, message, link_tab)
      values (new.trainer_id, 'pt_booked', v_name || ' booked a 1-on-1 with you on ' || v_when || '.', 'roster');
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

drop trigger if exists trg_notify_pt_booking on public.pt_bookings;
create trigger trg_notify_pt_booking
  after insert or update of status on public.pt_bookings
  for each row execute function notify_pt_booking_change();

-- ---------------- Reminders ----------------
-- One reminder per confirmed class / 1-on-1, sent once it's within 24
-- hours — but not for something booked in the last 6 hours before it
-- (you've only just booked it). Safe to call any time, by anyone; it
-- only ever tells people about their own bookings. Returns how many
-- were sent.
create or replace function send_booking_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp := gym_local_now();
  n integer := 0;
  k integer;
begin
  perform pg_advisory_xact_lock(hashtext('bnb_booking_reminders'));

  with due as (
    update public.bookings b set reminded_at = now()
    from public.class_sessions s
    where s.id = b.session_id and b.status = 'confirmed' and b.reminded_at is null
      and coalesce(s.status, 'scheduled') = 'scheduled'
      and s.date + s.start_time > v_now
      and s.date + s.start_time <= v_now + interval '24 hours'
      and b.booked_at < ((s.date + s.start_time) at time zone 'Africa/Nairobi') - interval '6 hours'
    returning b.user_id, b.session_id, s.date
  )
  insert into public.notifications (user_id, type, message, link_tab)
  select user_id, 'booking_reminder',
         'Reminder: ' || class_session_label(session_id)
         || case when date = v_now::date then ' (today).' else ' (tomorrow).' end,
         'schedule'
  from due;
  get diagnostics k = row_count;
  n := n + k;

  with due as (
    update public.pt_bookings p set reminded_at = now()
    from public.slots s
    where s.id = p.slot_id and p.status = 'confirmed' and p.reminded_at is null
      and s.date + s.start_time > v_now
      and s.date + s.start_time <= v_now + interval '24 hours'
      and p.booked_at < ((s.date + s.start_time) at time zone 'Africa/Nairobi') - interval '6 hours'
    returning p.user_id, p.trainer_id, s.date, s.start_time
  )
  insert into public.notifications (user_id, type, message, link_tab)
  select d.user_id, 'booking_reminder',
         'Reminder: your 1-on-1 with ' || coalesce(u.full_name, 'your coach') || ' '
         || case when d.date = v_now::date then 'today' else 'tomorrow' end
         || ' at ' || to_char(d.date + d.start_time, 'FMHH12:MI AM') || '.',
         'schedule'
  from due d left join public.users u on u.id = d.trainer_id;
  get diagnostics k = row_count;
  n := n + k;
  return n;
end;
$$;

-- ---------------- Permissions ----------------
revoke execute on function promote_class_waitlist(uuid) from public, anon, authenticated;
revoke execute on function book_class(uuid, uuid) from public, anon;
revoke execute on function cancel_class_booking(uuid) from public, anon;
revoke execute on function fill_class_from_waitlist(uuid) from public, anon;
revoke execute on function ensure_class_sessions(integer) from public, anon;
revoke execute on function send_booking_reminders() from public, anon;
revoke execute on function class_session_counts() from public, anon;
grant execute on function book_class(uuid, uuid) to authenticated;
grant execute on function cancel_class_booking(uuid) to authenticated;
grant execute on function fill_class_from_waitlist(uuid) to authenticated;
grant execute on function ensure_class_sessions(integer) to authenticated;
grant execute on function send_booking_reminders() to authenticated;
grant execute on function class_session_counts() to authenticated;

-- Members book and cancel only through the functions above. (Staff
-- keep "staff full access bookings" for the roster: no-show, promote.)
-- Note: re-running gym.sql would put these two back — run this file
-- again afterwards.
drop policy if exists "members create own bookings" on public.bookings;
drop policy if exists "members cancel own bookings" on public.bookings;

-- ---------------- Every 15 minutes, if pg_cron is available ----------------
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron not available (%). Reminders will go out when people open the app.', sqlerrm;
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'bnb-bookings';
    perform cron.schedule('bnb-bookings', '*/15 * * * *',
      'select public.ensure_class_sessions(); select public.send_booking_reminders();');
  end if;
end;
$$;

-- Create this term's sessions now.
select ensure_class_sessions() as sessions_created;

-- ============================================================
-- Check:
--   select * from recurring_slots('Mon/Wed/Fri 06:00, Tue-Thu 5:30pm, Weekends 9am');
--   select jobname, schedule from cron.job where jobname = 'bnb-bookings';  -- 1 row if pg_cron is on
--   select * from class_session_counts();
-- ============================================================
