-- ============================================================
-- FOOD LOG PRIVACY (Me > Food Log, formerly "Nutrition")
-- Run after 45-meal-plans.sql (uses is_meal_plan_staff_for()).
--
-- nutrition_log and nutrition_goals were readable and writable by ANY
-- staff member (is_staff()), while the rest of Meal Plan is limited to
-- the member's own coach and admins. The coach now sees a member's last
-- two weeks of Food Log next to their check-ins, so this brings both
-- tables in line with Meal Plan:
--   * the member: full access to their own rows (unchanged),
--   * their assigned coach and admins: read only,
--   * other staff: no access.
-- Coaches set targets in the meal plan itself (meal_plans.content
-- .targets), so they never need to write these tables.
-- ============================================================

drop policy if exists "staff full access nutrition_log" on public.nutrition_log;
drop policy if exists "coach or admin reads nutrition_log" on public.nutrition_log;
create policy "coach or admin reads nutrition_log"
  on public.nutrition_log for select
  using (is_meal_plan_staff_for(user_id));

drop policy if exists "staff full access nutrition_goals" on public.nutrition_goals;
drop policy if exists "coach or admin reads nutrition_goals" on public.nutrition_goals;
create policy "coach or admin reads nutrition_goals"
  on public.nutrition_goals for select
  using (is_meal_plan_staff_for(user_id));

-- ============================================================
-- Verify:
-- 1. As a member: log a day in Food Log → saves; Clear all → works.
-- 2. As that member's coach: Coach > Meal Plans > the member >
--    Check-ins shows their Food Log. As a different trainer:
--    select * from nutrition_log where user_id = '<member>' → no rows.
-- 3. As a coach: update/delete that member's nutrition_log → 0 rows.
-- ============================================================
