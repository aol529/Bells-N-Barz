-- ============================================================
-- NUTRITION GOALS — Calorie & Macro Calculator
-- One row per member, upserted from the Nutrition tab's calculator
-- (Mifflin-St Jeor BMR -> TDEE -> calorie/protein/fat/carb targets,
-- computed client-side in js/bells-n-barz-nutrition.js). Stores both
-- the inputs (so the form can reload with previous values) and the
-- computed targets (so the "Today" summary at the top of the
-- Nutrition tab can read them directly without recomputing). Same
-- owner-or-staff "for all" RLS shape as nutrition_log/weight_log — a
-- member manages their own row, staff have full access. No RPCs.
--
-- Run after gym.sql (needs is_staff()/my_user_id()).
-- ============================================================

create table if not exists public.nutrition_goals (
  user_id uuid primary key references public.users(id),
  sex text not null default 'male',
  age integer not null default 30,
  height_cm numeric not null default 170,
  weight_kg numeric not null default 70,
  activity_multiplier numeric not null default 1.375,
  goal text not null default 'maintain',
  target_calories integer not null,
  target_protein_g integer not null,
  target_carbs_g integer not null,
  target_fat_g integer not null,
  updated_at timestamptz not null default now()
);

alter table public.nutrition_goals enable row level security;

drop policy if exists "members manage own nutrition_goals" on public.nutrition_goals;
create policy "members manage own nutrition_goals"
  on public.nutrition_goals for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "staff full access nutrition_goals" on public.nutrition_goals;
create policy "staff full access nutrition_goals"
  on public.nutrition_goals for all
  using (is_staff());

-- ============================================================
-- Verify:
-- 1. As a member, upsert your own nutrition_goals row — succeeds.
-- 2. Same upsert with someone else's user_id — fails (RLS with check).
-- 3. As a different member, confirm that row isn't visible.
-- 4. As staff, confirm every member's nutrition_goals row is visible.
-- ============================================================
