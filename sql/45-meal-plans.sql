-- ============================================================
-- MEAL PLANS
-- Run after 41-coach-ratings.sql (uses is_admin() from there).
--
-- Follows the gym's meal-plan guide (Meal_Plan_Guide):
--   1. the member fills in the intake questionnaire,
--   2-3. calorie/macro targets come from the existing Nutrition
--        calculator (nutrition_goals, 18-nutrition-goals.sql) — not
--        duplicated here,
--   4-6. their coach writes the plan (meal pattern, rotating options,
--        swaps, eating-out plan, grocery list),
--   7. the member checks in every 2-3 weeks and the coach adjusts.
--
-- PRIVACY: the questionnaire includes health details (conditions,
-- medication, pregnancy, eating-disorder history). Like coach ratings,
-- this deliberately does NOT follow the app's usual "all staff see
-- everything" pattern. Readable only by:
--   * the member themselves,
--   * their assigned coach (users.trainer_id), and
--   * admins.
-- A member with no assigned coach is visible to admins only.
-- ============================================================

-- True if the caller may see/handle this member's meal-plan data as
-- their coach or an admin (the member's own access is checked
-- separately, by member_id = my_user_id()).
create or replace function is_meal_plan_staff_for(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin() or exists (
    select 1 from public.users
    where id = p_member_id
    and trainer_id is not null
    and trainer_id = my_user_id()
  );
$$;

-- ---------------- TABLES ----------------
create table if not exists public.meal_plan_intake (
  member_id uuid primary key references public.users(id),
  answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) < 32000),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_plans (
  member_id uuid primary key references public.users(id),
  coach_id uuid references public.users(id),
  content jsonb not null default '{}'::jsonb
    check (jsonb_typeof(content) = 'object' and pg_column_size(content) < 64000),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_plan_checkins (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.users(id),
  weight_kg numeric check (weight_kg is null or weight_kg between 20 and 400),
  energy smallint not null check (energy between 1 and 5),
  hunger smallint not null check (hunger between 1 and 5),
  digestion smallint not null check (digestion between 1 and 5),
  ease smallint not null check (ease between 1 and 5),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists idx_meal_plan_checkins_member on public.meal_plan_checkins(member_id, created_at desc);

alter table public.meal_plan_intake enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_checkins enable row level security;

-- ---------------- INTAKE: member writes, member/coach/admin read ----------------
drop policy if exists "meal_plan_intake read" on public.meal_plan_intake;
create policy "meal_plan_intake read"
  on public.meal_plan_intake for select
  using (member_id = my_user_id() or is_meal_plan_staff_for(member_id));

drop policy if exists "meal_plan_intake member insert" on public.meal_plan_intake;
create policy "meal_plan_intake member insert"
  on public.meal_plan_intake for insert
  with check (member_id = my_user_id());

drop policy if exists "meal_plan_intake member update" on public.meal_plan_intake;
create policy "meal_plan_intake member update"
  on public.meal_plan_intake for update
  using (member_id = my_user_id())
  with check (member_id = my_user_id());

-- ---------------- PLAN: coach/admin write, member/coach/admin read ----------------
drop policy if exists "meal_plans read" on public.meal_plans;
create policy "meal_plans read"
  on public.meal_plans for select
  using (member_id = my_user_id() or is_meal_plan_staff_for(member_id));

drop policy if exists "meal_plans coach insert" on public.meal_plans;
create policy "meal_plans coach insert"
  on public.meal_plans for insert
  with check (is_meal_plan_staff_for(member_id) and coach_id = my_user_id());

drop policy if exists "meal_plans coach update" on public.meal_plans;
create policy "meal_plans coach update"
  on public.meal_plans for update
  using (is_meal_plan_staff_for(member_id))
  with check (is_meal_plan_staff_for(member_id) and coach_id = my_user_id());

-- ---------------- CHECK-INS: member writes, member/coach/admin read ----------------
drop policy if exists "meal_plan_checkins read" on public.meal_plan_checkins;
create policy "meal_plan_checkins read"
  on public.meal_plan_checkins for select
  using (member_id = my_user_id() or is_meal_plan_staff_for(member_id));

drop policy if exists "meal_plan_checkins member insert" on public.meal_plan_checkins;
create policy "meal_plan_checkins member insert"
  on public.meal_plan_checkins for insert
  with check (member_id = my_user_id());

-- No delete policies anywhere — records are kept, not removed.

-- ---------------- TIMESTAMPS ----------------
create or replace function meal_plan_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if tg_table_name = 'meal_plan_intake' then
    new.submitted_at := coalesce(old.submitted_at, new.submitted_at);
  end if;
  return new;
end;
$$;

drop trigger if exists meal_plan_intake_touch on public.meal_plan_intake;
create trigger meal_plan_intake_touch before update on public.meal_plan_intake
  for each row execute function meal_plan_touch_updated_at();
drop trigger if exists meal_plans_touch on public.meal_plans;
create trigger meal_plans_touch before update on public.meal_plans
  for each row execute function meal_plan_touch_updated_at();

-- ---------------- NOTIFICATIONS ----------------
-- notifications is staff-insert-only (09-notifications.sql), so these
-- run as SECURITY DEFINER triggers. Member activity goes to their
-- coach, or to every admin if they have no coach yet.
create or replace function meal_plan_notify_staff(p_member_id uuid, p_type text, p_what text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_coach uuid;
begin
  select full_name, trainer_id into v_name, v_coach from public.users where id = p_member_id;
  insert into public.notifications (user_id, type, message, link_tab)
  select r.id, p_type, coalesce(v_name, 'A member') || ' ' || p_what, 'coach'
  from public.users r
  where r.status <> 'suspended'
  and r.id <> p_member_id
  and (
    (v_coach is not null and r.id = v_coach)
    or (v_coach is null and r.roles && array['admin']::text[])
  );
end;
$$;

create or replace function meal_plan_intake_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform meal_plan_notify_staff(new.member_id, 'meal_plan_intake',
    case when tg_op = 'INSERT' then 'filled in the meal plan questionnaire.'
         else 'updated their meal plan questionnaire.' end);
  return new;
end;
$$;
drop trigger if exists meal_plan_intake_notify on public.meal_plan_intake;
create trigger meal_plan_intake_notify after insert or update on public.meal_plan_intake
  for each row execute function meal_plan_intake_notify();

create or replace function meal_plan_checkin_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform meal_plan_notify_staff(new.member_id, 'meal_plan_checkin', 'sent a meal plan check-in.');
  return new;
end;
$$;
drop trigger if exists meal_plan_checkin_notify on public.meal_plan_checkins;
create trigger meal_plan_checkin_notify after insert on public.meal_plan_checkins
  for each row execute function meal_plan_checkin_notify();

create or replace function meal_plan_saved_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, message, link_tab)
  values (new.member_id, 'meal_plan_updated',
    case when tg_op = 'INSERT' then 'Your meal plan is ready — take a look.'
         else 'Your coach updated your meal plan.' end,
    'mealplan');
  return new;
end;
$$;
drop trigger if exists meal_plan_saved_notify on public.meal_plans;
create trigger meal_plan_saved_notify after insert or update on public.meal_plans
  for each row execute function meal_plan_saved_notify();

-- ============================================================
-- Verify:
-- 1. As a member: upsert your own meal_plan_intake row → succeeds, and
--    your coach gets a notification. Upserting another member's row → RLS error.
-- 2. As that member's coach: select from meal_plan_intake → sees it.
--    As a different trainer (not their coach, not admin) → sees nothing.
-- 3. As the coach: upsert meal_plans for the member with coach_id =
--    yourself → member gets "Your meal plan is ready".
-- 4. As the member: insert a meal_plan_checkins row → coach notified.
-- ============================================================
