-- ============================================================
-- INTERMITTENT FASTING TRACKER
-- Two tables, same "member owns their rows, staff full access" shape
-- as weight_log/period_log/nutrition_log — no RPCs needed, this is
-- pure per-member CRUD.
--
-- fasting_settings: one row per member, their chosen protocol (16:8,
-- 18:6, 20:4, or a custom fast/eat split). Upserted from the client.
--
-- fasting_log: one row per fast. fast_end is null while a fast (or its
-- following eating window) is still in progress — the client treats
-- "my most recent row with fast_end is null" as the active cycle.
-- planned_fast_hours snapshots the protocol's fast length AT THE TIME
-- the fast was started, so changing protocols later doesn't retroactively
-- change what counts as "hit the goal" for past fasts (see the streak
-- calculation in js/bells-n-barz-fasting.js).
-- ============================================================

create table if not exists public.fasting_settings (
  user_id uuid primary key references public.users(id),
  fast_hours integer not null default 16,
  eat_hours integer not null default 8,
  updated_at timestamptz not null default now()
);

create table if not exists public.fasting_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  fast_start timestamptz not null,
  fast_end timestamptz,
  planned_fast_hours integer not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_fasting_log_user_id on public.fasting_log(user_id);

alter table public.fasting_settings enable row level security;
alter table public.fasting_log enable row level security;

drop policy if exists "members manage own fasting_settings" on public.fasting_settings;
create policy "members manage own fasting_settings"
  on public.fasting_settings for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "staff full access fasting_settings" on public.fasting_settings;
create policy "staff full access fasting_settings"
  on public.fasting_settings for all
  using (is_staff());

drop policy if exists "members manage own fasting_log" on public.fasting_log;
create policy "members manage own fasting_log"
  on public.fasting_log for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "staff full access fasting_log" on public.fasting_log;
create policy "staff full access fasting_log"
  on public.fasting_log for all
  using (is_staff());

-- ============================================================
-- Verify:
-- 1. As a member, upsert fasting_settings with your own user_id —
--    succeeds. With someone else's user_id — fails (RLS with check).
-- 2. As that member, insert a fasting_log row (fast_start = now(),
--    fast_end = null, planned_fast_hours = 16) — succeeds.
-- 3. Update that same row's fast_end — succeeds (still your own row).
-- 4. As a different member, confirm neither row is visible.
-- 5. As staff, confirm both tables are fully visible/writable across
--    every member.
-- ============================================================
