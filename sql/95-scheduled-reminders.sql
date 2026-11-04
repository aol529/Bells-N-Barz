-- ============================================================
-- SCHEDULED REMINDERS: lunar events and birthdays
-- Run after 94-mpesa-claims.sql. Safe to re-run.
--
-- Until now Ekadashi, new moon, full moon and birthday notices only
-- went out when someone happened to open the site or app. This runs
-- them from the server every 15 minutes with pg_cron (the same job
-- system as the booking reminders in sql/62).
--
-- The moon maths is JavaScript, so its results are stored here:
-- lunar_calendar is written by tools/export-lunar-sql.mjs and runs to
-- the end of 2029. Re-run that tool to extend it. Claims go through
-- lunar_reminders_sent, so a member is never reminded twice even while
-- the site and app still make their own check.
-- ============================================================

create table if not exists public.lunar_calendar (
  kind text not null check (kind in ('ekadashi', 'new_moon', 'full_moon')),
  starts_at timestamptz not null,
  paksha text,
  primary key (kind, starts_at)
);
grant select on public.lunar_calendar to authenticated;
alter table public.lunar_calendar enable row level security;
drop policy if exists "everyone reads lunar_calendar" on public.lunar_calendar;
create policy "everyone reads lunar_calendar" on public.lunar_calendar for select using (true);

insert into public.lunar_calendar (kind, starts_at, paksha) values
('ekadashi','2026-11-04T05:36:00.000Z','Krishna'),
('new_moon','2026-11-09T07:02:00.000Z',null),
('ekadashi','2026-11-20T01:49:00.000Z','Shukla'),
('full_moon','2026-11-24T14:57:00.000Z',null),
('ekadashi','2026-12-03T17:36:00.000Z','Krishna'),
('new_moon','2026-12-09T00:53:00.000Z',null),
('ekadashi','2026-12-19T16:42:00.000Z','Shukla'),
('full_moon','2026-12-24T01:31:00.000Z',null),
('ekadashi','2027-01-02T08:56:00.000Z','Krishna'),
('new_moon','2027-01-07T20:26:00.000Z',null),
('ekadashi','2027-01-18T04:58:00.000Z','Shukla'),
('full_moon','2027-01-22T12:18:00.000Z',null),
('ekadashi','2027-02-01T03:13:00.000Z','Krishna'),
('new_moon','2027-02-06T15:58:00.000Z',null),
('ekadashi','2027-02-16T14:50:00.000Z','Shukla'),
('full_moon','2027-02-20T23:23:00.000Z',null),
('ekadashi','2027-03-02T23:15:00.000Z','Krishna'),
('new_moon','2027-03-08T09:32:00.000Z',null),
('ekadashi','2027-03-17T22:52:00.000Z','Shukla'),
('full_moon','2027-03-22T10:45:00.000Z',null),
('ekadashi','2027-04-01T19:16:00.000Z','Krishna'),
('new_moon','2027-04-06T23:53:00.000Z',null),
('ekadashi','2027-04-16T05:53:00.000Z','Shukla'),
('full_moon','2027-04-20T22:29:00.000Z',null),
('ekadashi','2027-05-01T13:26:00.000Z','Krishna'),
('new_moon','2027-05-06T11:01:00.000Z',null),
('ekadashi','2027-05-15T12:49:00.000Z','Shukla'),
('full_moon','2027-05-20T11:00:00.000Z',null),
('ekadashi','2027-05-31T04:36:00.000Z','Krishna'),
('new_moon','2027-06-04T19:42:00.000Z',null),
('ekadashi','2027-06-13T20:44:00.000Z','Shukla'),
('full_moon','2027-06-19T00:44:00.000Z',null),
('ekadashi','2027-06-29T16:37:00.000Z','Krishna'),
('new_moon','2027-07-04T03:04:00.000Z',null),
('ekadashi','2027-07-13T06:41:00.000Z','Shukla'),
('full_moon','2027-07-18T15:46:00.000Z',null),
('ekadashi','2027-07-29T02:07:00.000Z','Krishna'),
('new_moon','2027-08-02T10:07:00.000Z',null),
('ekadashi','2027-08-11T19:32:00.000Z','Shukla'),
('full_moon','2027-08-17T07:32:00.000Z',null),
('ekadashi','2027-08-27T09:59:00.000Z','Krishna'),
('new_moon','2027-08-31T17:43:00.000Z',null),
('ekadashi','2027-09-10T11:35:00.000Z','Shukla'),
('full_moon','2027-09-15T23:06:00.000Z',null),
('ekadashi','2027-09-25T17:04:00.000Z','Krishna'),
('new_moon','2027-09-30T02:38:00.000Z',null),
('ekadashi','2027-10-10T06:14:00.000Z','Shukla'),
('full_moon','2027-10-15T13:49:00.000Z',null),
('ekadashi','2027-10-25T00:13:00.000Z','Krishna'),
('new_moon','2027-10-29T13:38:00.000Z',null),
('ekadashi','2027-11-09T02:08:00.000Z','Shukla'),
('full_moon','2027-11-14T03:28:00.000Z',null),
('ekadashi','2027-11-23T08:18:00.000Z','Krishna'),
('new_moon','2027-11-28T03:26:00.000Z',null),
('ekadashi','2027-12-08T21:32:00.000Z','Shukla'),
('full_moon','2027-12-13T16:12:00.000Z',null),
('ekadashi','2027-12-22T18:13:00.000Z','Krishna'),
('new_moon','2027-12-27T20:14:00.000Z',null),
('ekadashi','2028-01-07T15:04:00.000Z','Shukla'),
('full_moon','2028-01-12T04:05:00.000Z',null),
('ekadashi','2028-01-21T06:49:00.000Z','Krishna'),
('new_moon','2028-01-26T15:14:00.000Z',null),
('ekadashi','2028-02-06T05:51:00.000Z','Shukla'),
('full_moon','2028-02-10T15:03:00.000Z',null),
('ekadashi','2028-02-19T22:20:00.000Z','Krishna'),
('new_moon','2028-02-25T10:40:00.000Z',null),
('ekadashi','2028-03-06T17:33:00.000Z','Shukla'),
('full_moon','2028-03-11T01:05:00.000Z',null),
('ekadashi','2028-03-20T16:08:00.000Z','Krishna'),
('new_moon','2028-03-26T04:35:00.000Z',null),
('ekadashi','2028-04-05T02:17:00.000Z','Shukla'),
('full_moon','2028-04-09T10:27:00.000Z',null),
('ekadashi','2028-04-19T10:46:00.000Z','Krishna'),
('new_moon','2028-04-24T19:51:00.000Z',null),
('ekadashi','2028-05-04T08:43:00.000Z','Shukla'),
('full_moon','2028-05-08T19:51:00.000Z',null),
('ekadashi','2028-05-19T04:43:00.000Z','Krishna'),
('new_moon','2028-05-24T08:19:00.000Z',null),
('ekadashi','2028-06-02T14:03:00.000Z','Shukla'),
('full_moon','2028-06-07T06:11:00.000Z',null),
('ekadashi','2028-06-17T21:00:00.000Z','Krishna'),
('new_moon','2028-06-22T18:29:00.000Z',null),
('ekadashi','2028-07-01T19:46:00.000Z','Shukla'),
('full_moon','2028-07-06T18:12:00.000Z',null),
('ekadashi','2028-07-17T11:18:00.000Z','Krishna'),
('new_moon','2028-07-22T03:03:00.000Z',null),
('ekadashi','2028-07-31T03:21:00.000Z','Shukla'),
('full_moon','2028-08-05T08:10:00.000Z',null),
('ekadashi','2028-08-15T23:45:00.000Z','Krishna'),
('new_moon','2028-08-20T10:45:00.000Z',null),
('ekadashi','2028-08-29T14:04:00.000Z','Shukla'),
('full_moon','2028-09-03T23:49:00.000Z',null),
('ekadashi','2028-09-14T10:29:00.000Z','Krishna'),
('new_moon','2028-09-18T18:25:00.000Z',null),
('ekadashi','2028-09-28T04:30:00.000Z','Shukla'),
('full_moon','2028-10-03T16:28:00.000Z',null),
('ekadashi','2028-10-13T19:45:00.000Z','Krishna'),
('new_moon','2028-10-18T02:59:00.000Z',null),
('ekadashi','2028-10-27T22:21:00.000Z','Shukla'),
('full_moon','2028-11-02T09:20:00.000Z',null),
('ekadashi','2028-11-12T04:02:00.000Z','Krishna'),
('new_moon','2028-11-16T13:20:00.000Z',null),
('ekadashi','2028-11-26T18:33:00.000Z','Shukla'),
('full_moon','2028-12-02T01:41:00.000Z',null),
('ekadashi','2028-12-11T12:04:00.000Z','Krishna'),
('new_moon','2028-12-16T02:08:00.000Z',null),
('ekadashi','2028-12-26T15:30:00.000Z','Shukla'),
('full_moon','2028-12-31T16:49:00.000Z',null),
('ekadashi','2029-01-09T20:52:00.000Z','Krishna'),
('new_moon','2029-01-14T17:27:00.000Z',null),
('ekadashi','2029-01-25T11:23:00.000Z','Shukla'),
('full_moon','2029-01-30T06:04:00.000Z',null),
('ekadashi','2029-02-08T07:17:00.000Z','Krishna'),
('new_moon','2029-02-13T10:33:00.000Z',null),
('ekadashi','2029-02-24T04:38:00.000Z','Shukla'),
('full_moon','2029-02-28T17:10:00.000Z',null),
('ekadashi','2029-03-09T19:50:00.000Z','Krishna'),
('new_moon','2029-03-15T04:21:00.000Z',null),
('ekadashi','2029-03-25T18:10:00.000Z','Shukla'),
('full_moon','2029-03-30T02:26:00.000Z',null),
('ekadashi','2029-04-08T10:19:00.000Z','Krishna'),
('new_moon','2029-04-13T21:43:00.000Z',null),
('ekadashi','2029-04-24T03:55:00.000Z','Shukla'),
('full_moon','2029-04-28T10:38:00.000Z',null),
('ekadashi','2029-05-08T02:13:00.000Z','Krishna'),
('new_moon','2029-05-13T13:46:00.000Z',null),
('ekadashi','2029-05-23T10:40:00.000Z','Shukla'),
('full_moon','2029-05-27T18:40:00.000Z',null),
('ekadashi','2029-06-06T18:54:00.000Z','Krishna'),
('new_moon','2029-06-12T03:54:00.000Z',null),
('ekadashi','2029-06-21T15:46:00.000Z','Shukla'),
('full_moon','2029-06-26T03:24:00.000Z',null),
('ekadashi','2029-07-06T11:44:00.000Z','Krishna'),
('new_moon','2029-07-11T15:53:00.000Z',null),
('ekadashi','2029-07-20T20:44:00.000Z','Shukla'),
('full_moon','2029-07-25T13:37:00.000Z',null),
('ekadashi','2029-08-05T04:06:00.000Z','Krishna'),
('new_moon','2029-08-10T01:56:00.000Z',null),
('ekadashi','2029-08-19T03:00:00.000Z','Shukla'),
('full_moon','2029-08-24T01:52:00.000Z',null),
('ekadashi','2029-09-03T19:22:00.000Z','Krishna'),
('new_moon','2029-09-08T10:45:00.000Z',null),
('ekadashi','2029-09-17T11:46:00.000Z','Shukla'),
('full_moon','2029-09-22T16:30:00.000Z',null),
('ekadashi','2029-10-03T09:03:00.000Z','Krishna'),
('new_moon','2029-10-07T19:17:00.000Z',null),
('ekadashi','2029-10-16T23:57:00.000Z','Shukla'),
('full_moon','2029-10-22T09:30:00.000Z',null),
('ekadashi','2029-11-01T20:54:00.000Z','Krishna'),
('new_moon','2029-11-06T04:27:00.000Z',null),
('ekadashi','2029-11-15T15:53:00.000Z','Shukla'),
('full_moon','2029-11-21T04:06:00.000Z',null),
('ekadashi','2029-12-01T07:11:00.000Z','Krishna'),
('new_moon','2029-12-05T14:54:00.000Z',null),
('ekadashi','2029-12-15T11:14:00.000Z','Shukla'),
('full_moon','2029-12-20T22:48:00.000Z',null),
('ekadashi','2029-12-30T16:22:00.000Z','Krishna')
on conflict do nothing;

create or replace function send_scheduled_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  e record;
  r record;
  v_when text;
  v_body text;
  v_sender uuid;
  v_thread uuid;
  v_sent integer := 0;
  v_names text;
  v_today date := (now() at time zone 'Africa/Nairobi')::date;
begin
  for e in
    select * from lunar_calendar where starts_at > now() and starts_at <= now() + interval '24 hours'
  loop
    v_when := to_char(e.starts_at at time zone 'Africa/Nairobi', 'FMDay, Mon FMDD "at" FMHH12:MI AM');
    v_body := case e.kind
      when 'ekadashi' then 'Reminder: ' || coalesce(e.paksha, '') || ' Paksha Ekadashi begins ' || v_when || '.'
      when 'new_moon' then 'Reminder: New moon (Amavasya) is ' || v_when || '.'
      else 'Reminder: Full moon (Purnima) is ' || v_when || '.'
    end;
    for r in
      select u.id, u.trainer_id from users u
      where u.status <> 'suspended' and u.archived_at is null and u.roles && array['member']::text[]
    loop
      insert into lunar_reminders_sent (member_id, kind, event_start)
      values (r.id, e.kind, date_trunc('minute', e.starts_at))
      on conflict do nothing;
      if not found then continue; end if;

      v_sender := coalesce(r.trainer_id,
        (select a.id from users a where a.roles && array['admin']::text[] and a.status <> 'suspended' and a.id <> r.id
         order by a.created_at limit 1));
      if v_sender is not null and v_sender <> r.id then
        select id into v_thread from dm_threads where user_a = least(v_sender, r.id) and user_b = greatest(v_sender, r.id);
        if v_thread is null then
          insert into dm_threads (user_a, user_b) values (least(v_sender, r.id), greatest(v_sender, r.id)) returning id into v_thread;
        end if;
        insert into dm_messages (thread_id, sender_id, body) values (v_thread, v_sender, v_body);
        update dm_threads set updated_at = now(), last_sender_id = v_sender where id = v_thread;
        v_thread := null;
      end if;
      insert into notifications (user_id, type, message, link_tab)
      values (r.id, 'lunar_reminder', v_body, case when v_sender is null then null else 'inbox' end);
      v_sent := v_sent + 1;
    end loop;
  end loop;

  -- Birthdays: one notice a day to each staff member, from 7am Nairobi time.
  if extract(hour from now() at time zone 'Africa/Nairobi') >= 7 then
    select string_agg(full_name, ', ' order by full_name) into v_names
    from users
    where roles && array['member']::text[] and status <> 'suspended' and archived_at is null
      and dob is not null and length(dob::text) >= 10
      and substr(dob::text, 6, 5) = to_char(v_today, 'MM-DD');
    if v_names is not null then
      insert into notifications (user_id, type, message, link_tab)
      select s.id, 'birthday_today', 'Birthdays today: ' || v_names || '.', null
      from users s
      where s.roles && array['admin', 'trainer', 'staff']::text[] and s.status <> 'suspended' and s.archived_at is null
        and not exists (
          select 1 from notifications n
          where n.user_id = s.id and n.type = 'birthday_today'
            and (n.created_at at time zone 'Africa/Nairobi')::date = v_today);
    end if;
  end if;
  return v_sent;
end;
$$;

-- Only the scheduler runs this, never a signed-in person.
revoke all on function send_scheduled_reminders() from public, anon, authenticated;

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron not available (%). Reminders still go out when people open the app.', sqlerrm;
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'bnb-reminders';
    perform cron.schedule('bnb-reminders', '*/15 * * * *', 'select public.send_scheduled_reminders();');
  end if;
end;
$$;

-- ============================================================
-- Check:
--   select jobname, schedule from cron.job;     -- bnb-reminders listed
--   select count(*), max(starts_at) from lunar_calendar;
--   select * from cron.job_run_details order by start_time desc limit 5;
-- ============================================================
