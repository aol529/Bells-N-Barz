-- ============================================================
-- PERIOD LOG (Me > Period) — create it where it's missing
-- Safe to run anywhere, any time: creates the table only if it doesn't
-- exist, and re-applies the same RLS as gym.sql.
--
-- Found Oct 2026: the staging project (which the GitHub Pages site uses)
-- had no public.period_log at all ("Could not find the table
-- 'public.period_log' in the schema cache"), so Me > Period could
-- neither load nor save. Definition matches 01-schema.sql; policies
-- match the PERIOD_LOG section of gym.sql (needs my_user_id() and
-- is_staff() from there).
-- ============================================================

create table if not exists public.period_log (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  date date not null,
  flow text,
  symptoms text[] default '{}'::text[],
  notes text,
  created_at timestamp with time zone default now(),
  constraint period_log_pkey primary key (id),
  constraint period_log_user_id_fkey foreign key (user_id) references public.users(id)
);

alter table public.period_log enable row level security;

drop policy if exists "members manage own period_log" on public.period_log;
create policy "members manage own period_log"
  on public.period_log for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

drop policy if exists "staff full access period_log" on public.period_log;
create policy "staff full access period_log"
  on public.period_log for all
  using (is_staff());

-- Same grants every other table gets (see 05-grant-schema-privileges.sql);
-- RLS above is what actually limits who sees which rows.
grant all on public.period_log to anon, authenticated, service_role;

-- PostgREST caches the schema; this makes the new table visible to the
-- app straight away instead of after the next automatic reload.
notify pgrst, 'reload schema';
