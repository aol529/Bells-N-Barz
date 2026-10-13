-- ============================================================
-- UNPAID INVOICE REMINDERS
-- Run after 70-open-slot-reminders.sql. Safe to re-run.
--
-- send_invoice_reminders(), called from send_booking_reminders()
-- (every 15 minutes via pg_cron, and when anyone opens the app). Only
-- sends between 9 AM and 8 PM gym time.
--
-- Members, for each invoice with money still owing (amount minus
-- payments; not voided; not a credit/comp; member not archived):
--   * 3 days before it's due: "$45.00 for Membership is due Fri 16 Oct."
--   * once it's overdue: the day after, then a week, two and three
--     weeks later (4 at most), with how many days overdue.
-- Staff (admin/staff roles): every Monday, one summary — how many
--   invoices are overdue, the total, and the oldest.
-- invoice_reminders / billing_digest_sent make sure each goes once.
-- Everything else in send_booking_reminders() is as in sql/70.
-- ============================================================

create table if not exists public.invoice_reminders (
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  kind text not null,               -- 'due-soon', 'overdue-0' … 'overdue-3'
  sent_at timestamptz not null default now(),
  primary key (invoice_id, kind)
);
create table if not exists public.billing_digest_sent (
  user_id uuid not null references public.users(id) on delete cascade,
  week_start date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
alter table public.invoice_reminders enable row level security;
alter table public.billing_digest_sent enable row level security;
-- Staff can see which reminders went out; nobody writes but the function.
drop policy if exists "invoice reminders: staff read" on public.invoice_reminders;
create policy "invoice reminders: staff read" on public.invoice_reminders for select to authenticated using (is_staff());
grant select on public.invoice_reminders to authenticated;
revoke all on public.invoice_reminders from anon;
revoke all on public.billing_digest_sent from anon, authenticated;

create or replace function bnb_money(p numeric)
returns text
language sql
immutable
as $$ select '$' || to_char(round(coalesce(p, 0), 2), 'FM999,999,990.00'); $$;

-- Invoices with money still owing: not voided, not a credit, member
-- not archived, amount minus payments > 0.
create or replace function owing_invoices()
returns table(id uuid, user_id uuid, type text, due_date date, owing numeric)
language sql
stable
security definer
set search_path = public
as $$
  select i.id, i.user_id, i.type, i.due_date, i.amount - coalesce(pd.paid, 0)
  from public.invoices i
  join public.users u on u.id = i.user_id
  left join (select invoice_id, sum(amount) as paid from public.payments group by invoice_id) pd on pd.invoice_id = i.id
  where not coalesce(i.voided, false) and i.amount > 0 and i.due_date is not null
    and u.archived_at is null
    and i.amount - coalesce(pd.paid, 0) > 0.004;
$$;
revoke execute on function owing_invoices() from public, anon, authenticated;

create or replace function send_invoice_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp := gym_local_now();
  v_today date := gym_local_now()::date;
  v_monday date := gym_local_now()::date - (extract(isodow from gym_local_now())::int - 1);
  n integer := 0;
  k integer;
begin
  if v_now::time < time '09:00' or v_now::time >= time '20:00' then return 0; end if;

  -- Due in 3 days (or fewer, if it was issued late) — once.
  with due as (
    insert into public.invoice_reminders (invoice_id, kind)
    select id, 'due-soon' from owing_invoices()
    where due_date between v_today and v_today + 3
    on conflict do nothing
    returning invoice_id
  )
  insert into public.notifications (user_id, type, message, link_tab)
  select o.user_id, 'invoice_reminder',
         'Payment reminder: ' || bnb_money(o.owing) || ' for '
         || case o.type when 'membership' then 'Membership' when 'pt-session' then 'a 1-on-1 session'
                        when 'package' then 'a session package' else 'your account' end
         || ' is due ' || case when o.due_date = v_today then 'today' else to_char(o.due_date, 'FMDy FMDD FMMon') end
         || '. Pay at the front desk, or message us with any questions.',
         'messages'
  from due d join owing_invoices() o on o.id = d.invoice_id;
  get diagnostics k = row_count;
  n := n + k;

  -- Overdue: day 1, 8, 15 and 22 after the due date.
  with due as (
    insert into public.invoice_reminders (invoice_id, kind)
    select id, 'overdue-' || ((v_today - due_date - 1) / 7) from owing_invoices()
    where due_date < v_today and (v_today - due_date - 1) / 7 <= 3
    on conflict do nothing
    returning invoice_id
  )
  insert into public.notifications (user_id, type, message, link_tab)
  select o.user_id, 'invoice_reminder',
         'Overdue: ' || bnb_money(o.owing) || ' for '
         || case o.type when 'membership' then 'Membership' when 'pt-session' then 'a 1-on-1 session'
                        when 'package' then 'a session package' else 'your account' end
         || ' was due ' || to_char(o.due_date, 'FMDy FMDD FMMon') || ' (' || (v_today - o.due_date)
         || case when v_today - o.due_date = 1 then ' day' else ' days' end || ' ago). '
         || 'Please pay at the front desk, or message us if something''s not right.',
         'messages'
  from due d join owing_invoices() o on o.id = d.invoice_id;
  get diagnostics k = row_count;
  n := n + k;

  -- Staff: Monday summary of everything overdue.
  if extract(isodow from v_now) = 1 and exists (select 1 from owing_invoices() where due_date < v_today) then
    with sent as (
      insert into public.billing_digest_sent (user_id, week_start)
      select u.id, v_monday from public.users u
      where coalesce(u.roles, '{}') && array['admin','staff']::text[] and u.archived_at is null
      on conflict do nothing
      returning user_id
    ),
    summary as (
      select count(*) as cnt, sum(o.owing) as total,
             (select coalesce(u.full_name, 'a member') || ' (' || (v_today - o2.due_date) || ' days)'
              from owing_invoices() o2 join public.users u on u.id = o2.user_id
              where o2.due_date < v_today order by o2.due_date, o2.owing desc limit 1) as oldest
      from owing_invoices() o where o.due_date < v_today
    )
    insert into public.notifications (user_id, type, message, link_tab)
    select s.user_id, 'invoice_reminder',
           sm.cnt || ' overdue invoice' || case when sm.cnt = 1 then '' else 's' end || ', ' || bnb_money(sm.total)
           || ' outstanding — the oldest is ' || sm.oldest || '. See Billing.',
           'billing'
    from sent s cross join summary sm;
    get diagnostics k = row_count;
    n := n + k;
  end if;

  return n;
end;
$$;

revoke execute on function send_invoice_reminders() from public, anon, authenticated;

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

  -- Unpaid invoices (sql/71)
  n := n + send_invoice_reminders();

  return n;
end;
$$;
