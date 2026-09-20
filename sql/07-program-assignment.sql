-- ============================================================
-- PROGRAM ASSIGNMENT
-- Lets a coach's edit to a member's programs row be distinguished from
-- the member's own self-edit — just enough to know a program was
-- assigned by staff, and when, without any new tables or RLS changes.
--
-- Deliberately minimal (agreed in design discussion before this was
-- written):
-- - No new assignment/relationship table. The coach-client relationship
--   already exists via confirmed pt_bookings, surfaced today through
--   activeClientIdsForTrainer() in js/bells-n-barz-booking-coach.js
--   (built for the Coach Dashboard's Client Progress panel) — that same
--   list is the intended gate for "which clients can this coach assign
--   a program to" at the UI level.
-- - No versioning/history. programs.owner_id stays UNIQUE, so a new
--   assignment overwrites the old one, same destructive-overwrite
--   behavior a member's own self-edit already has today.
-- - No RLS changes. The existing policy on programs
--   ("owner or staff can write programs", owner_id = my_user_id() or
--   is_staff(), from gym.sql) already lets any staff member write any
--   member's row — consistent with every other table in this schema
--   (any staff = full access), not a new hole opened by this migration.
-- ============================================================

alter table public.programs
  add column if not exists assigned_by uuid references public.users(id),
  add column if not exists assigned_at timestamptz;

-- ============================================================
-- Verify:
-- 1. Existing rows are unaffected — both new columns default to null,
--    so every member's current self-authored program still reads back
--    exactly as it did before this migration:
--      select owner_id, assigned_by, assigned_at from public.programs limit 5;
--    (assigned_by/assigned_at should be null for anything not yet
--    touched by the not-yet-built Program Builder client-picker.)
--
-- 2. As staff, confirm you can still write another member's programs
--    row (already true before this migration, just re-confirming it
--    isn't broken):
--      update public.programs set assigned_by = '<staff user id>',
--        assigned_at = now() where owner_id = '<some member id>';
--    (should succeed under the existing RLS policy, no changes needed.)
-- ============================================================
