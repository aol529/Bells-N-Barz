-- ============================================================
-- BODY MEASUREMENTS (Me > Weight > Body Composition)
-- Run after 45-meal-plans.sql (uses is_meal_plan_staff_for()).
--
-- Tape measurements behind the Body Composition calculator: waist, neck
-- and hips, one row per member per day (same shape as weight_log). The
-- app works out waist-to-height, RFM, Navy body fat, FFMI and ABSI from
-- these plus the member's height and weight, so only the raw
-- measurements are stored. sex is kept on the row because the body fat
-- formulas differ for men and women and users has no sex column.
--
-- Access:
--   * the member: full access to their own rows,
--   * their coach (assigned trainer, or a trainer with a confirmed 1-on-1
--     booking with them, the same list as Coach > Client Progress) and
--     admins: read only,
--   * other staff: no access.
-- ============================================================

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  date date not null,
  sex text not null check (sex in ('male', 'female')),
  waist_cm numeric not null check (waist_cm > 0 and waist_cm < 400),
  neck_cm numeric check (neck_cm is null or (neck_cm > 0 and neck_cm < 150)),
  hip_cm numeric check (hip_cm is null or (hip_cm > 0 and hip_cm < 400)),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

grant select, insert, update, delete on public.body_measurements to authenticated;

-- True if the caller coaches this member: their assigned trainer, a
-- trainer with a confirmed 1-on-1 booking with them, or an admin.
create or replace function is_coach_for(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_meal_plan_staff_for(p_member_id) or exists (
    select 1 from public.pt_bookings
    where user_id = p_member_id
    and trainer_id = my_user_id()
    and status = 'confirmed'
  );
$$;

alter table public.body_measurements enable row level security;

drop policy if exists "members manage own body_measurements" on public.body_measurements;
create policy "members manage own body_measurements"
  on public.body_measurements for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "coach or admin reads body_measurements" on public.body_measurements;
create policy "coach or admin reads body_measurements"
  on public.body_measurements for select
  using (is_coach_for(user_id));

-- ============================================================
-- Verify:
-- 1. As a member: save measurements in Me > Weight > Body Composition →
--    a row appears; saving the same date again updates it.
-- 2. As that member's coach: Coach Dashboard > Client Progress >
--    Body Weight & Fat % > Tape Body Fat % shows their trend. As a
--    trainer with no link to them:
--    select * from body_measurements where user_id = '<member>' → no rows.
-- 3. As a coach: update/delete that member's row → 0 rows.
-- ============================================================
