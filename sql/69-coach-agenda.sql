-- ============================================================
-- COACH "TOMORROW" SUMMARY
-- Run after 68-class-waitlist-reminders.sql. Safe to re-run.
--
-- Once a day, from 6 PM gym time, each coach with anything on tomorrow
-- gets one notification listing it in time order:
--   7:00 AM 1-on-1 with Mem One — "deadlift form"
--   12:00 PM open slot
--   5:30 PM Strength Foundations 8/8, 3 waiting
-- (blocked slots and cancelled classes left out). It goes out with
-- send_booking_reminders() — every 15 minutes via pg_cron, and when
-- anyone opens the app — and coach_agenda_sent makes sure it's once.
-- Everything else in send_booking_reminders() is as in sql/68.
-- ============================================================

create table if not exists public.coach_agenda_sent (
  coach_id uuid not null references public.users(id) on delete cascade,
  for_date date not null,
  sent_at timestamptz not null default now(),
  primary key (coach_id, for_date)
);
alter table public.coach_agenda_sent enable row level security;
-- No policies: only the function below touches it.
revoke all on public.coach_agenda_sent from anon, authenticated;

create or replace function send_coach_agendas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp := gym_local_now();
  v_day date := (gym_local_now())::date + 1;
  c record;
  v_items text;
  n integer := 0;
begin
  if v_now::time < time '18:00' then return 0; end if;

  for c in
    select distinct coach_id from (
      select coalesce(s.instructor_id, cl.instructor_id) as coach_id
      from public.class_sessions s left join public.classes cl on cl.id = s.class_id
      where s.date = v_day and coalesce(s.status, 'scheduled') = 'scheduled'
      union
      select trainer_id from public.slots where date = v_day and status <> 'blocked'
    ) x
    where coach_id is not null
      and not exists (select 1 from public.coach_agenda_sent a where a.coach_id = x.coach_id and a.for_date = v_day)
  loop
    select string_agg(line, ' · ' order by t) into v_items from (
      select sl.start_time as t,
             to_char(v_day + sl.start_time, 'FMHH12:MI AM') || ' ' ||
             case when p.id is not null
                  then '1-on-1 with ' || coalesce(u.full_name, 'a member')
                       || case when coalesce(p.notes, '') <> '' then ' — "' || left(p.notes, 60) || case when char_length(p.notes) > 60 then '…' else '' end || '"' else '' end
                  else 'open slot' end as line
      from public.slots sl
      left join public.pt_bookings p on p.slot_id = sl.id and p.status = 'confirmed'
      left join public.users u on u.id = p.user_id
      where sl.trainer_id = c.coach_id and sl.date = v_day and sl.status <> 'blocked'
      union all
      select s.start_time,
             to_char(v_day + s.start_time, 'FMHH12:MI AM') || ' ' || coalesce(cl.name, 'Class') || ' '
             || (select count(*) from public.bookings b where b.session_id = s.id and b.status = 'confirmed')
             || '/' || class_session_capacity(s.id)
             || coalesce(', ' || nullif((select count(*) from public.bookings b where b.session_id = s.id and b.status = 'waitlisted'), 0) || ' waiting', '')
      from public.class_sessions s left join public.classes cl on cl.id = s.class_id
      where s.date = v_day and coalesce(s.status, 'scheduled') = 'scheduled'
        and coalesce(s.instructor_id, cl.instructor_id) = c.coach_id
    ) items;

    insert into public.coach_agenda_sent (coach_id, for_date) values (c.coach_id, v_day) on conflict do nothing;
    if v_items is not null then
      insert into public.notifications (user_id, type, message, link_tab)
      values (c.coach_id, 'booking_reminder',
              left('Tomorrow (' || to_char(v_day, 'FMDy FMDD FMMon') || '): ' || v_items, 900), 'roster');
      n := n + 1;
    end if;
  end loop;
  return n;
end;
$$;

revoke execute on function send_coach_agendas() from public, anon, authenticated;

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

  -- Coaches' "Tomorrow" summary (sql/69)
  n := n + send_coach_agendas();

  return n;
end;
$$;
