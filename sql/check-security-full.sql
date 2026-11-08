-- ============================================================
-- FULL SECURITY REVIEW — read-only. One row per finding.
-- Changes nothing. Run in the Supabase SQL editor and read top-down;
-- "high" rows need a look, "review" rows are probably intended (public
-- content) but worth confirming, "info" is context.
-- ============================================================
with
pol as (
  select schemaname, tablename, policyname, cmd, roles::text as roles, coalesce(qual, '') as qual, coalesce(with_check, '') as wc
  from pg_policies where schemaname in ('public', 'storage')
),
findings as (
  -- 1. Tables with row security off: open to anyone with the public key.
  select 'high' as level, 'rls off' as check_name, tablename::text as object, 'Row security is off: every row is open to the public key.' as detail
  from pg_tables where schemaname = 'public' and not rowsecurity

  -- 2. Policies that let signed-out visitors (anon / public) write.
  union all
  select 'high', 'anon can write', tablename || ' · ' || policyname, cmd || ' to ' || roles || ' using (' || left(qual, 120) || ') check (' || left(wc, 120) || ')'
  from pol
  where cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL') and (roles like '%anon%' or roles like '%public%')
    and schemaname = 'public'

  -- 3. Write policies with no condition at all ("true"): anyone they apply to can change any row.
  union all
  select 'high', 'write without condition', tablename || ' · ' || policyname, cmd || ' to ' || roles || ' using (' || qual || ') check (' || wc || ')'
  from pol
  where cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL') and schemaname = 'public'
    and (qual in ('true', '') and wc in ('true', '') )

  -- 4. Tables anyone (signed out too) can read.
  union all
  select 'review', 'public read', tablename || ' · ' || policyname, 'SELECT to ' || roles || ' using (' || left(qual, 160) || ')'
  from pol
  where cmd in ('SELECT', 'ALL') and schemaname = 'public' and (roles like '%anon%' or roles like '%public%')

  -- 4b. Read policies with no condition for signed-in users: every member can read every row.
  union all
  select 'review', 'any member reads all', tablename || ' · ' || policyname, 'SELECT to ' || roles || ' using (' || qual || ')'
  from pol
  where cmd = 'SELECT' and schemaname = 'public' and roles like '%authenticated%' and qual = 'true'

  -- 5. Table privileges for anon beyond reading.
  union all
  select 'review', 'anon table grant', table_name::text, string_agg(privilege_type, ', ')
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee = 'anon' and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
  group by table_name

  -- 6. SECURITY DEFINER functions a signed-out visitor can call (they skip row security).
  union all
  select 'review', 'definer callable by anon', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
         case when p.proconfig is null then 'no search_path set' else 'search_path set' end
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef and has_function_privilege('anon', p.oid, 'execute')
    and p.prorettype <> 'trigger'::regtype

  -- 7. SECURITY DEFINER functions without a fixed search_path (can be tricked into using lookalike objects).
  union all
  select 'high', 'definer without search_path', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', 'set search_path = public is missing'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef and p.proconfig is null

  -- 8. Views: they skip row security unless security_invoker is on.
  union all
  select case when coalesce((select option_value from pg_options_to_table(c.reloptions) where option_name = 'security_invoker'), 'false') in ('true', 'on') then 'info' else 'high' end,
         'view', c.relname::text,
         'security_invoker=' || coalesce((select option_value from pg_options_to_table(c.reloptions) where option_name = 'security_invoker'), 'off')
         || '; anon select=' || has_table_privilege('anon', c.oid, 'select') || '; member select=' || has_table_privilege('authenticated', c.oid, 'select')
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('v', 'm')

  -- 9. Storage buckets.
  union all
  select case when public then 'review' else 'info' end, 'bucket', id::text,
         (case when public then 'PUBLIC (anyone with the link reads files)' else 'private' end) || '; limit ' || coalesce((file_size_limit / 1048576)::text || ' MB', 'none') || '; types ' || coalesce(array_to_string(allowed_mime_types, ','), 'any')
  from storage.buckets

  -- 10. Storage rules that let signed-out visitors upload, change or delete.
  union all
  select 'high', 'storage anon write', policyname, cmd || ' to ' || roles || ' using (' || left(qual, 120) || ') check (' || left(wc, 120) || ')'
  from pol
  where schemaname = 'storage' and tablename = 'objects' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL') and (roles like '%anon%' or roles like '%public%')
    and position('auth.' in qual || wc) = 0 and position('is_admin' in qual || wc) = 0 and position('is_staff' in qual || wc) = 0 and position('my_user_id' in qual || wc) = 0

  -- 11. The staff-column guard on users (members can't raise their own role/balance).
  union all
  select case when exists (
      select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid and c.relname = 'users'
      join pg_proc p on p.oid = t.tgfoid and p.proname = 'protect_staff_only_user_columns'
      where not t.tgisinternal and t.tgenabled <> 'D') then 'info' else 'high' end,
    'users guard', 'protect_staff_only_user_columns', 'trigger present and enabled = ' || exists (
      select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid and c.relname = 'users'
      join pg_proc p on p.oid = t.tgfoid and p.proname = 'protect_staff_only_user_columns'
      where not t.tgisinternal and t.tgenabled <> 'D')
)
select level, check_name, object, detail from findings
order by case level when 'high' then 0 when 'review' then 1 else 2 end, check_name, object;
