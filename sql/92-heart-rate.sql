-- ============================================================
-- HEART RATE LOG
-- Run after 50-blood-pressure-and-steps.sql. Safe to re-run.
--
-- One row per reading. The Android app writes them from its own
-- camera measurement (finger over the camera and flash) or imports them
-- from Health Connect (watches, the phone maker's health app). Same
-- access as blood pressure: the member manages their own, their coach
-- and admins can read them.
-- ============================================================

create table if not exists public.heart_rate_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  taken_at timestamptz not null,
  bpm int not null check (bpm between 25 and 250),
  source text check (source is null or length(source) <= 80),
  created_at timestamptz not null default now()
);
create index if not exists heart_rate_log_user_taken_idx on public.heart_rate_log (user_id, taken_at);

grant select, insert, update, delete on public.heart_rate_log to authenticated;
alter table public.heart_rate_log enable row level security;

drop policy if exists "members manage own heart_rate_log" on public.heart_rate_log;
create policy "members manage own heart_rate_log"
  on public.heart_rate_log for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "coach or admin reads heart_rate_log" on public.heart_rate_log;
create policy "coach or admin reads heart_rate_log"
  on public.heart_rate_log for select
  using (is_coach_for(user_id));

-- Verify: as a member, measure in the app (Track > Heart) → a row appears;
-- a trainer not linked to that member sees no rows.
