-- ============================================================
-- MEAL PLAN SHOPPING LIST + WEEKLY FOOD BUDGET
-- Run after 45-meal-plans.sql (uses is_meal_plan_staff_for()).
--
-- One shopping list per member (Me > Meal Plan > Shopping): items start
-- from their coach's plan grocery list (or the diet they're trying),
-- they tick items off and note what each cost, and the page totals the
-- week against their weekly food budget. "New week" clears the ticks
-- and prices but keeps the items.
--
-- The member edits their own list; their coach and admins can read it
-- (same rule as the rest of Meal Plan) so the coach can see when food
-- costs more than the member can afford and adjust the plan.
-- ============================================================

create table if not exists public.meal_plan_shopping (
  member_id uuid primary key references public.users(id),
  -- [{ id, name, category, checked, price }] — price in KES, or null
  items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 200 and pg_column_size(items) < 64000),
  budget_kes integer check (budget_kes is null or budget_kes between 0 and 10000000),
  week_start date not null default current_date,
  updated_at timestamptz not null default now()
);

alter table public.meal_plan_shopping enable row level security;

drop policy if exists "meal_plan_shopping read" on public.meal_plan_shopping;
create policy "meal_plan_shopping read"
  on public.meal_plan_shopping for select
  using (member_id = my_user_id() or is_meal_plan_staff_for(member_id));

drop policy if exists "member writes own shopping" on public.meal_plan_shopping;
create policy "member writes own shopping"
  on public.meal_plan_shopping for insert
  with check (member_id = my_user_id());

drop policy if exists "member updates own shopping" on public.meal_plan_shopping;
create policy "member updates own shopping"
  on public.meal_plan_shopping for update
  using (member_id = my_user_id())
  with check (member_id = my_user_id());

-- No delete policy: "New week" resets the row instead.

drop trigger if exists meal_plan_shopping_touch on public.meal_plan_shopping;
create or replace function meal_plan_shopping_touch()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;
create trigger meal_plan_shopping_touch before update on public.meal_plan_shopping
  for each row execute function meal_plan_shopping_touch();

-- ============================================================
-- Verify:
-- 1. As a member: upsert your own meal_plan_shopping row → works;
--    another member's → RLS error.
-- 2. As that member's coach: select it → visible (read-only: an update
--    from the coach → RLS error).
-- ============================================================
