-- ============================================================
-- BLOOD OXYGEN (SpO2) LOG
-- Run after 92-heart-rate.sql. Safe to re-run.
--
-- One row per reading from the Android app: a phone's oximetry sensor
-- (e.g. Infinix), typed in from a fingertip oximeter, or Health Connect.
-- Same access as heart rate: the member manages their own; their coach
-- and admins can read them.
-- ============================================================

create table if not exists public.spo2_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  taken_at timestamptz not null,
  spo2 int not null check (spo2 between 50 and 100),
  source text check (source is null or length(source) <= 80),
  created_at timestamptz not null default now()
);
create index if not exists spo2_log_user_taken_idx on public.spo2_log (user_id, taken_at);

grant select, insert, update, delete on public.spo2_log to authenticated;
alter table public.spo2_log enable row level security;

drop policy if exists "members manage own spo2_log" on public.spo2_log;
create policy "members manage own spo2_log"
  on public.spo2_log for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "coach or admin reads spo2_log" on public.spo2_log;
create policy "coach or admin reads spo2_log"
  on public.spo2_log for select
  using (is_coach_for(user_id));
