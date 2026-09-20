-- ============================================================
-- NUTRITION TRACKER
-- A daily food/macro summary log for members — one row per calendar
-- day (calories, protein/carbs/fat, water, notes), not a meal-by-meal
-- diary. Same shape and RLS as weight_log/period_log: a member manages
-- their own rows, staff have full access. No RPCs needed — this is a
-- pure per-member CRUD table, same as weight_log/period_log.
-- ============================================================

create table if not exists public.nutrition_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  date date not null,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  water_ml integer,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.nutrition_log enable row level security;

drop policy if exists "members manage own nutrition_log" on public.nutrition_log;
create policy "members manage own nutrition_log"
  on public.nutrition_log for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "staff full access nutrition_log" on public.nutrition_log;
create policy "staff full access nutrition_log"
  on public.nutrition_log for all
  using (is_staff());

-- ============================================================
-- Verify:
-- 1. As a member, insert a row with your own user_id — should succeed.
-- 2. As that same member, try inserting a row with someone else's
--    user_id — should fail (RLS with check).
-- 3. As staff, select across all members' nutrition_log rows — should
--    succeed regardless of user_id.
-- ============================================================
