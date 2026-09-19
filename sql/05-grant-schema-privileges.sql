-- ============================================================
-- FIX: authenticated/anon roles were missing baseline table-level
-- GRANTs on the public schema on at least one project (staging).
--
-- Supabase normally applies these defaults automatically when a
-- project is created, but they were never captured here — so this
-- step lived only as an undocumented manual fix on production and
-- was silently missing on staging. Symptom: every query against
-- these tables failed with "permission denied for table <name>"
-- even for a fully authenticated, RLS-eligible user, because a
-- missing GRANT is checked before Postgres ever evaluates RLS.
--
-- This only restores table-level access — it does not bypass
-- Row Level Security. The policies in 01-schema.sql and the other
-- numbered fixes still govern which rows a role can actually see
-- or write.
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ============================================================
-- Verify:
-- 1. As a signed-up member, confirm the profile lookup that
--    previously failed now succeeds:
--      select * from public.users where auth_id = auth.uid();
--    (should return your own row, not a "permission denied" error)
--
-- 2. Confirm RLS is still enforced, not bypassed, by this GRANT:
--    as that same member, try to read another member's row by id
--    — it should come back empty, not error, matching existing
--    RLS behavior documented in 03-fix-users-self-escalation.sql.
--
-- Run this on EVERY project (production, staging, and any future
-- environment) — it's idempotent, safe to re-run.
-- ============================================================
