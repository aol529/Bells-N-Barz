-- ============================================================
-- DIETS ("Try a diet") + AI MEAL PLAN SUGGESTIONS
-- Run after 45-meal-plans.sql (uses is_admin(), is_meal_plan_staff_for()
-- and meal_plan_notify_staff() from 41/45).
--
-- Brought over from the Meal Plan Sandbox (github.com/aol529/
-- meal-plan-sandbox), where these were tried out in localStorage.
--
-- 1. Diets are defined in JS files (js/bells-n-barz-diet-*.js). Their
--    author can edit them in Coach > Meal Plans > My diets; those edits
--    are stored here and replace the file's defaults field by field.
-- 2. A member can "try" one diet at a time; their coach is notified,
--    and check-ins record which diet they were on.
-- 3. AI suggestions: a Supabase Edge Function (supabase/functions/
--    ai-suggest) drafts a plan with Claude and stores it here. The API
--    key lives only in the function's secrets, never in the browser.
-- ============================================================

-- ---------------- DIET OWNERSHIP ----------------
-- Which account authored each diet. Seeded here rather than trusted from
-- the browser, so nobody else can claim a diet by saving edits first.
create table if not exists public.diet_registry (
  diet_id text primary key,
  owner_id uuid not null references public.users(id)
);
alter table public.diet_registry enable row level security;
drop policy if exists "anyone signed in reads diet_registry" on public.diet_registry;
create policy "anyone signed in reads diet_registry"
  on public.diet_registry for select using (auth.uid() is not null);
-- No client writes: add diets here in a migration.

-- Coach KA's Diet belongs to Kevin Aol (Coach KA). This is his STAGING
-- user id — on production, replace it with his production users.id.
insert into public.diet_registry (diet_id, owner_id)
select 'coach-ka-2025', id from public.users where id = '870adc3b-df42-4435-b3c5-942bb4cc2245'
on conflict (diet_id) do nothing;

-- ---------------- DIET EDITS ----------------
create table if not exists public.diet_edits (
  diet_id text primary key references public.diet_registry(diet_id),
  owner_id uuid not null references public.users(id),
  published boolean,          -- copied out of edits so RLS can hide drafts
  edits jsonb not null check (jsonb_typeof(edits) = 'object' and pg_column_size(edits) < 300000),
  updated_at timestamptz not null default now()
);
alter table public.diet_edits enable row level security;

-- Members see edits for published diets; the author sees their own drafts.
drop policy if exists "read published or own diet_edits" on public.diet_edits;
create policy "read published or own diet_edits"
  on public.diet_edits for select
  using (owner_id = my_user_id() or published is not false);

-- Only the registered author can write, and only for their own diet.
drop policy if exists "author writes diet_edits" on public.diet_edits;
create policy "author writes diet_edits"
  on public.diet_edits for insert
  with check (owner_id = my_user_id() and exists (
    select 1 from public.diet_registry r where r.diet_id = diet_edits.diet_id and r.owner_id = my_user_id()));
drop policy if exists "author updates diet_edits" on public.diet_edits;
create policy "author updates diet_edits"
  on public.diet_edits for update
  using (owner_id = my_user_id())
  with check (owner_id = my_user_id() and exists (
    select 1 from public.diet_registry r where r.diet_id = diet_edits.diet_id and r.owner_id = my_user_id()));
drop policy if exists "author deletes diet_edits" on public.diet_edits;
create policy "author deletes diet_edits"
  on public.diet_edits for delete
  using (owner_id = my_user_id());

-- ---------------- TRYING A DIET ----------------
create table if not exists public.diet_trials (
  member_id uuid primary key references public.users(id),
  diet_id text not null references public.diet_registry(diet_id),
  diet_name text not null check (char_length(diet_name) <= 120),
  variant text check (variant is null or char_length(variant) <= 20),
  variant_label text check (variant_label is null or char_length(variant_label) <= 120),
  started_at timestamptz not null default now()
);
alter table public.diet_trials enable row level security;

drop policy if exists "diet_trials read" on public.diet_trials;
create policy "diet_trials read"
  on public.diet_trials for select
  using (member_id = my_user_id() or is_meal_plan_staff_for(member_id));
drop policy if exists "member starts own diet_trial" on public.diet_trials;
create policy "member starts own diet_trial"
  on public.diet_trials for insert with check (member_id = my_user_id());
drop policy if exists "member updates own diet_trial" on public.diet_trials;
create policy "member updates own diet_trial"
  on public.diet_trials for update using (member_id = my_user_id()) with check (member_id = my_user_id());
drop policy if exists "member stops own diet_trial" on public.diet_trials;
create policy "member stops own diet_trial"
  on public.diet_trials for delete using (member_id = my_user_id());

-- Tell the coach (or admins) when a member starts, switches or stops.
create or replace function diet_trial_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform meal_plan_notify_staff(old.member_id, 'diet_trial', 'stopped trying ' || old.diet_name || '.');
    return old;
  end if;
  if tg_op = 'UPDATE' and new.diet_id = old.diet_id and new.variant is not distinct from old.variant then
    return new;
  end if;
  perform meal_plan_notify_staff(new.member_id, 'diet_trial',
    case when tg_op = 'UPDATE' and new.diet_id = old.diet_id then 'switched to ' else 'started trying ' end ||
    new.diet_name || coalesce(' (' || new.variant_label || ')', '') || '.');
  return new;
end;
$$;
drop trigger if exists diet_trial_notify on public.diet_trials;
create trigger diet_trial_notify after insert or update or delete on public.diet_trials
  for each row execute function diet_trial_notify();

-- Check-ins record the diet being tried at the time (set server-side,
-- so it can't be faked or forgotten by the client).
alter table public.meal_plan_checkins add column if not exists diet text;
create or replace function meal_plan_checkin_set_diet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select t.diet_name || coalesce(' — ' || t.variant_label, '') into new.diet
  from public.diet_trials t where t.member_id = new.member_id;
  return new;
end;
$$;
drop trigger if exists meal_plan_checkin_set_diet on public.meal_plan_checkins;
create trigger meal_plan_checkin_set_diet before insert on public.meal_plan_checkins
  for each row execute function meal_plan_checkin_set_diet();

-- ---------------- AI SUGGESTIONS ----------------
-- Written only by the ai-suggest Edge Function (service role); readable
-- by the member, their coach and admins, like the rest of Meal Plan.
create table if not exists public.meal_plan_ai (
  member_id uuid primary key references public.users(id),
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  model text,
  created_at timestamptz not null default now()
);
alter table public.meal_plan_ai enable row level security;
drop policy if exists "meal_plan_ai read" on public.meal_plan_ai;
create policy "meal_plan_ai read"
  on public.meal_plan_ai for select
  using (member_id = my_user_id() or is_meal_plan_staff_for(member_id));

-- One row per request, for the function's rate limit (no client access).
create table if not exists public.meal_plan_ai_log (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.users(id),
  requested_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_meal_plan_ai_log_member on public.meal_plan_ai_log(member_id, created_at desc);
alter table public.meal_plan_ai_log enable row level security;

-- ============================================================
-- Verify:
-- 1. As a member: select * from diet_registry → coach-ka-2025.
--    insert into diet_edits (...) → RLS error (not the author).
-- 2. As Kevin: insert/update diet_edits for coach-ka-2025 → works.
-- 3. As a member: insert your diet_trials row → your coach gets a
--    notification; insert a meal_plan_checkins row → its diet column
--    is filled in automatically.
-- 4. As a member: select * from meal_plan_ai → only your own row.
-- ============================================================
