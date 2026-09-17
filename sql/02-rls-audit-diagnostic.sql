-- ============================================================
-- RLS AUDIT — run this first, paste me the output
-- ============================================================
-- This doesn't change anything. It just tells us, table by table:
--   1. Is RLS even turned ON (a table with RLS off is wide open to
--      anyone holding the anon key, regardless of what policies exist)
--   2. What policies exist, who they apply to, and what condition
--      they check
-- ============================================================

-- 1. RLS enabled/disabled per table
select
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2. Every policy that currently exists, with its actual condition
select
  schemaname,
  tablename,
  policyname,
  cmd as applies_to,        -- select / insert / update / delete / all
  roles,
  qual as using_condition,        -- controls SELECT/UPDATE/DELETE visibility
  with_check as insert_update_check  -- controls what INSERT/UPDATE is allowed to write
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. Tables that have ZERO policies at all (these are the most
--    dangerous if RLS is also off, or even if RLS is on with no
--    policies — that actually blocks everyone including legitimate
--    users, which is safer but probably breaks the app)
select tablename
from pg_tables
where schemaname = 'public'
and tablename not in (
  select distinct tablename from pg_policies where schemaname = 'public'
)
order by tablename;
