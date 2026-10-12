-- ============================================================
-- SECURITY CHECK — read-only, one row. Paste the result back.
-- Run on each Supabase project (staging = the GitHub Pages site).
-- ============================================================
select
  -- Should be 0 / empty: a table with RLS off is open to anyone with the
  -- public key, whatever its policies say.
  (select count(*) from pg_tables
     where schemaname = 'public' and not rowsecurity)              as tables_without_rls,
  (select string_agg(tablename, ', ') from pg_tables
     where schemaname = 'public' and not rowsecurity)              as which_tables_without_rls,

  -- Should be true: the trigger on users that stops members changing
  -- their own roles/status/balance/credits/… (sql/03, 13, 38, 40, 52).
  exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid and c.relname = 'users'
    join pg_proc p on p.oid = t.tgfoid and p.proname = 'protect_staff_only_user_columns'
    where not t.tgisinternal and t.tgenabled <> 'D'
  )                                                                as staff_column_trigger_on,

  -- Should be true once sql/52 has run.
  coalesce((select position('archived_at' in pg_get_functiondef(p.oid)) > 0
     from pg_proc p where p.proname = 'protect_staff_only_user_columns'
     limit 1), false)                                              as trigger_protects_archived_at,

  -- Should list both "owner or staff can read programs" and
  -- "owner or staff can write programs" (gym.sql), and nothing broader.
  (select string_agg(policyname || ' [' || cmd || ']', '; ' order by policyname)
     from pg_policies where schemaname = 'public' and tablename = 'programs')
                                                                   as programs_policies,

  -- Should be true once sql/53 has run.
  to_regclass('public.period_log') is not null                     as period_log_exists;
