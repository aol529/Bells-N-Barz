-- ============================================================
-- BLOOD PRESSURE + STEPS (Me > Blood Pressure, Me > Steps)
-- Run after 49-body-measurements.sql (uses is_coach_for()).
--
-- blood_pressure_log: one row per reading. People often take two or
-- three readings in a sitting, or morning and evening, so it's keyed by
-- a timestamp, not one row per day. Pulse and note are optional.
--
-- step_log: one row per member per day (same shape as weight_log);
-- logging the same day again overwrites it.
--
-- Access (same as body_measurements):
--   * the member: full access to their own rows,
--   * their coach and admins: read only,
--   * other staff: no access.
-- ============================================================

create table if not exists public.blood_pressure_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  taken_at timestamptz not null,
  systolic int not null check (systolic between 50 and 300),
  diastolic int not null check (diastolic between 30 and 200),
  pulse int check (pulse is null or pulse between 20 and 250),
  note text check (note is null or length(note) <= 200),
  created_at timestamptz not null default now(),
  check (systolic > diastolic)
);
create index if not exists blood_pressure_log_user_taken_idx
  on public.blood_pressure_log (user_id, taken_at);

create table if not exists public.step_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  date date not null,
  steps int not null check (steps between 0 and 200000),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

grant select, insert, update, delete on public.blood_pressure_log to authenticated;
grant select, insert, update, delete on public.step_log to authenticated;

alter table public.blood_pressure_log enable row level security;
alter table public.step_log enable row level security;

drop policy if exists "members manage own blood_pressure_log" on public.blood_pressure_log;
create policy "members manage own blood_pressure_log"
  on public.blood_pressure_log for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "coach or admin reads blood_pressure_log" on public.blood_pressure_log;
create policy "coach or admin reads blood_pressure_log"
  on public.blood_pressure_log for select
  using (is_coach_for(user_id));

drop policy if exists "members manage own step_log" on public.step_log;
create policy "members manage own step_log"
  on public.step_log for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "coach or admin reads step_log" on public.step_log;
create policy "coach or admin reads step_log"
  on public.step_log for select
  using (is_coach_for(user_id));

-- ============================================================
-- Verify:
-- 1. As a member: log a reading in Me > Blood Pressure → a row appears;
--    log two in a row → two rows. Delete one from the history → gone.
-- 2. As a member: log steps in Me > Steps → a row; same date again
--    updates it.
-- 3. As a trainer with no link to them:
--    select * from step_log where user_id = '<member>' → no rows.
-- ============================================================
