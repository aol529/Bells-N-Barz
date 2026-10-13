-- ============================================================
-- COACH "WORKOUTS TO TRY"
-- Run after 60-message-attachments.sql. Safe to re-run.
--
-- A coach's private shelf of workouts they want to try: a title, the
-- text they pasted in (source), and the app's parsed version of it
-- (variants: [{name, exercises: [{name, presc, sets}]}]).
--
-- Private to the coach who saved it — not even other staff can see it.
-- Only staff can save one (members don't have this card).
-- ============================================================

create table if not exists public.coach_workouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default my_user_id() references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  source text not null default '' check (char_length(source) <= 20000),
  variants jsonb not null default '[]'::jsonb check (jsonb_typeof(variants) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_coach_workouts_owner on public.coach_workouts(owner_id, updated_at desc);

alter table public.coach_workouts enable row level security;

drop policy if exists "coach workouts: read own" on public.coach_workouts;
create policy "coach workouts: read own" on public.coach_workouts for select to authenticated
  using (owner_id = my_user_id());

drop policy if exists "coach workouts: staff add own" on public.coach_workouts;
create policy "coach workouts: staff add own" on public.coach_workouts for insert to authenticated
  with check (owner_id = my_user_id() and is_staff());

drop policy if exists "coach workouts: edit own" on public.coach_workouts;
create policy "coach workouts: edit own" on public.coach_workouts for update to authenticated
  using (owner_id = my_user_id())
  with check (owner_id = my_user_id());

drop policy if exists "coach workouts: delete own" on public.coach_workouts;
create policy "coach workouts: delete own" on public.coach_workouts for delete to authenticated
  using (owner_id = my_user_id());

grant select, insert, update, delete on public.coach_workouts to authenticated;
revoke all on public.coach_workouts from anon;
