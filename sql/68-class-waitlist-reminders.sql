-- ============================================================
-- CLASS WAITLIST REMINDERS
-- Run after 67-pt-waitlist-reminders.sql. Safe to re-run.
--
-- send_booking_reminders() now also, for class waitlists:
--   1. reminds each member still waitlisted, once, within 24 hours of
--      the class, with their place (not if they joined in the last 6
--      hours) — bookings.waitlist_reminded_at, kept apart from
--      reminded_at so someone who later gets a spot still gets the
--      normal "Reminder: …" for it;
--   2. once the class has started, moves anyone still waitlisted to
--      'expired' (so it drops out of My Schedule) and tells them a spot
--      didn't open up.
-- Everything else in the function is as in sql/67.
-- ============================================================

alter table public.bookings add column if not exists waitlist_reminded_at timestamptz;

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

  -- Classes (sql/62)
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

  -- Class waitlists (sql/68): a reminder within 24 hours, with your place.
  with places as (
    select b.id, row_number() over (partition by b.session_id order by b.booked_at, b.id) as place
    from public.bookings b where b.status = 'waitlisted'
  ),
  due as (
    update public.bookings b set waitlist_reminded_at = now()
    from public.class_sessions s, places pl
    where s.id = b.session_id and pl.id = b.id and b.status = 'waitlisted' and b.waitlist_reminded_at is null
      and coalesce(s.status, 'scheduled') = 'scheduled'
      and s.date + s.start_time > v_now
      and s.date + s.start_time <= v_now + interval '24 hours'
      and b.booked_at < ((s.date + s.start_time) at time zone 'Africa/Nairobi') - interval '6 hours'
    returning b.user_id, b.session_id, s.date, pl.place
  )
  insert into public.notifications (user_id, type, message, link_tab)
  select user_id, 'booking_reminder',
         'You''re #' || place || ' on the waitlist for ' || class_session_label(session_id)
         || case when date = v_now::date then ' (today)' else ' (tomorrow)' end
         || '. You''ll be booked in automatically if a spot opens — leave the waitlist if you can''t make it.',
         'schedule'
  from due;
  get diagnostics k = row_count;
  n := n + k;

  -- Class waitlists: close them once the class has started. Only tell
  -- people about ones from the last day (older ones close quietly).
  with gone as (
    update public.bookings b set status = 'expired'
    from public.class_sessions s
    where s.id = b.session_id and b.status = 'waitlisted' and s.date + s.start_time <= v_now
    returning b.user_id, b.session_id, s.date, s.start_time, coalesce(s.status, 'scheduled') as sess_status
  )
  insert into public.notifications (user_id, type, message, link_tab)
  select user_id, 'class_cancelled',
         class_session_label(session_id) || ' didn''t have a spot open up, so you''re off its waitlist.',
         'schedule'
  from gone
  where sess_status = 'scheduled' and date + start_time > v_now - interval '1 day';
  get diagnostics k = row_count;
  n := n + k;

  -- 1-on-1s (sql/62)
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

  -- 1-on-1 waitlists: a reminder within 24 hours, with your place.
  with places as (
    select w.id, row_number() over (partition by w.slot_id order by w.created_at, w.id) as place
    from public.pt_waitlist w where w.status = 'waiting'
  ),
  due as (
    update public.pt_waitlist w set reminded_at = now()
    from public.slots s, places pl
    where s.id = w.slot_id and pl.id = w.id and w.status = 'waiting' and w.reminded_at is null
      and s.date + s.start_time > v_now
      and s.date + s.start_time <= v_now + interval '24 hours'
      and w.created_at < ((s.date + s.start_time) at time zone 'Africa/Nairobi') - interval '6 hours'
    returning w.user_id, s.trainer_id, s.date, s.start_time, pl.place
  )
  insert into public.notifications (user_id, type, message, link_tab)
  select d.user_id, 'booking_reminder',
         'You''re #' || d.place || ' on the waitlist for a 1-on-1 with ' || coalesce(t.full_name, 'your coach') || ' '
         || case when d.date = v_now::date then 'today' else 'tomorrow' end
         || ' at ' || to_char(d.date + d.start_time, 'FMHH12:MI AM') || '. '
         || case when coalesce(m.credits, 0) < 1
                 then 'You have no credits left, so you''d be skipped if it opens up — get one first, or leave the waitlist.'
                 else 'You''ll be booked in automatically if it opens up — leave the waitlist if you can''t make it.' end,
         'schedule'
  from due d
  left join public.users t on t.id = d.trainer_id
  left join public.users m on m.id = d.user_id;
  get diagnostics k = row_count;
  n := n + k;

  -- 1-on-1 waitlists: close them once the slot has started. Only tell
  -- people about ones from the last day (older ones close quietly).
  with gone as (
    update public.pt_waitlist w set status = 'expired'
    from public.slots s
    where s.id = w.slot_id and w.status = 'waiting' and s.date + s.start_time <= v_now
    returning w.user_id, s.trainer_id, s.date, s.start_time
  )
  insert into public.notifications (user_id, type, message, link_tab)
  select g.user_id, 'pt_cancelled',
         'The 1-on-1 with ' || coalesce(t.full_name, 'your coach') || ' on ' || bnb_when(g.date, g.start_time)
         || ' you were waiting for didn''t open up. Book a Trainer has other times.',
         'schedule'
  from gone g left join public.users t on t.id = g.trainer_id
  where g.date + g.start_time > v_now - interval '1 day';
  get diagnostics k = row_count;
  n := n + k;

  return n;
end;
$$;
