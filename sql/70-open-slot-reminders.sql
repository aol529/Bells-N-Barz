-- ============================================================
-- OPEN 1-ON-1 SLOT REMINDERS
-- Run after 69-coach-agenda.sql. Safe to re-run.
--
-- send_open_slot_reminders(), called from send_booking_reminders()
-- (every 15 minutes via pg_cron, and when anyone opens the app):
--
-- 1. Members — last-minute availability. From noon gym time, each
--    member with a credit gets one message listing tomorrow's still-open
--    slots with their coach(es): the coach they're assigned to
--    (users.trainer_id) or one they've had a 1-on-1 with in the last 90
--    days. Slots clashing with a 1-on-1 they already have are left out.
--    Once per member per day (open_slot_offers_sent).
-- 2. Coaches — on the day. A slot still open within 3 hours of its
--    start: "still open — block it if you won't be in". One message per
--    coach per run, each slot once (slots.open_reminded_at).
-- 3. Coaches — empty week. Sunday from 6 PM, a coach with no open or
--    booked slots Monday–Sunday gets a nudge to add some. Once per week
--    (coach_week_nudge_sent).
-- Everything else in send_booking_reminders() is as in sql/69.
-- ============================================================

alter table public.slots add column if not exists open_reminded_at timestamptz;

create table if not exists public.open_slot_offers_sent (
  user_id uuid not null references public.users(id) on delete cascade,
  for_date date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, for_date)
);
create table if not exists public.coach_week_nudge_sent (
  coach_id uuid not null references public.users(id) on delete cascade,
  week_start date not null,
  sent_at timestamptz not null default now(),
  primary key (coach_id, week_start)
);
alter table public.open_slot_offers_sent enable row level security;
alter table public.coach_week_nudge_sent enable row level security;
-- No policies: only the function below touches them.
revoke all on public.open_slot_offers_sent from anon, authenticated;
revoke all on public.coach_week_nudge_sent from anon, authenticated;

create or replace function send_open_slot_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp := gym_local_now();
  v_tomorrow date := gym_local_now()::date + 1;
  v_week date := gym_local_now()::date + 1;  -- the Monday after a Sunday
  m record;
  v_list text;
  n integer := 0;
  k integer;
begin
  -- 1. Members: tomorrow's open slots with their coach(es), from noon.
  if v_now::time >= time '12:00' then
    for m in
      select u.id from public.users u
      where coalesce(u.credits, 0) >= 1
        and not (coalesce(u.roles, '{}') && array['admin','trainer','staff']::text[])
        and not exists (select 1 from public.open_slot_offers_sent o where o.user_id = u.id and o.for_date = v_tomorrow)
        and exists (select 1 from public.slots s where s.date = v_tomorrow and s.status = 'open')
    loop
      select string_agg(coach_line, '; ' order by coach_name) into v_list from (
        select c.full_name as coach_name,
               coalesce(c.full_name, 'Your coach') || ': ' || string_agg(to_char(v_tomorrow + s.start_time, 'FMHH12:MI AM'), ', ' order by s.start_time) as coach_line
        from public.slots s
        join public.users c on c.id = s.trainer_id
        where s.date = v_tomorrow and s.status = 'open'
          and (
            exists (select 1 from public.users me where me.id = m.id and me.trainer_id = s.trainer_id)
            or exists (select 1 from public.pt_bookings p join public.slots ps on ps.id = p.slot_id
                       where p.user_id = m.id and p.trainer_id = s.trainer_id and p.status = 'confirmed'
                         and ps.date between v_now::date - 90 and v_now::date)
          )
          and not exists (
            select 1 from public.pt_bookings p join public.slots ps on ps.id = p.slot_id
            where p.user_id = m.id and p.status = 'confirmed' and ps.date = v_tomorrow
              and ps.start_time < s.start_time + make_interval(mins => coalesce(s.duration, 60))
              and s.start_time < ps.start_time + make_interval(mins => coalesce(ps.duration, 60)))
        group by c.id, c.full_name
      ) per_coach;

      if v_list is not null then
        insert into public.open_slot_offers_sent (user_id, for_date) values (m.id, v_tomorrow) on conflict do nothing;
        insert into public.notifications (user_id, type, message, link_tab)
        values (m.id, 'booking_reminder', left('1-on-1s still free tomorrow — ' || v_list || '. Book in Book a Trainer.', 600), 'schedule');
        n := n + 1;
      end if;
    end loop;
  end if;

  -- 2. Coaches: a slot still open within 3 hours.
  with due as (
    update public.slots s set open_reminded_at = now()
    where s.status = 'open' and s.open_reminded_at is null
      and s.date + s.start_time > v_now
      and s.date + s.start_time <= v_now + interval '3 hours'
    returning s.trainer_id, s.start_time
  ),
  per_coach as (
    select trainer_id, count(*) as cnt,
           string_agg(to_char(date '2000-01-01' + start_time, 'FMHH12:MI AM'), ' and ' order by start_time) as times
    from due group by trainer_id
  )
  insert into public.notifications (user_id, type, message, link_tab)
  select trainer_id, 'booking_reminder',
         'Your ' || times || ' 1-on-1 slot' || case when cnt > 1 then 's are' else ' is' end
         || ' still open — block ' || case when cnt > 1 then 'them' else 'it' end || ' in your calendar if you won''t be in.',
         'roster'
  from per_coach;
  get diagnostics k = row_count;
  n := n + k;

  -- 3. Coaches: nothing up for the coming week (Sunday from 6 PM).
  if extract(isodow from v_now) = 7 and v_now::time >= time '18:00' then
    with nudged as (
      insert into public.coach_week_nudge_sent (coach_id, week_start)
      select u.id, v_week from public.users u
      where coalesce(u.roles, '{}') && array['trainer']::text[]
        and not exists (select 1 from public.slots s where s.trainer_id = u.id and s.status <> 'blocked'
                        and s.date between v_week and v_week + 6)
      on conflict do nothing
      returning coach_id
    )
    insert into public.notifications (user_id, type, message, link_tab)
    select coach_id, 'booking_reminder',
           'You''ve no 1-on-1 slots up for next week (from ' || to_char(v_week, 'FMDy FMDD FMMon')
           || ') — add some in your calendar so members can book.', 'roster'
    from nudged;
    get diagnostics k = row_count;
    n := n + k;
  end if;

  return n;
end;
$$;

revoke execute on function send_open_slot_reminders() from public, anon, authenticated;

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

  -- Open 1-on-1 slots (sql/70)
  n := n + send_open_slot_reminders();

  return n;
end;
$$;
