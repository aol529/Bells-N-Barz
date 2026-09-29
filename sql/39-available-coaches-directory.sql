-- ============================================================
-- AVAILABLE COACHES DIRECTORY
-- Found while testing sql/38: a plain member's RLS read access is
-- "own row only" ("members can read own row" in gym.sql) — there was
-- never a policy letting a member read anyone else's row, trainers
-- included. That means the member-facing "Your Coach" picker (sql/38)
-- had nothing to list, and the pre-existing "Book a Trainer" flow in
-- Schedule has been silently broken the same way all along, for any
-- member whose local `users` array wasn't already fully populated by
-- an admin/staff session in the same browser.
--
-- Fix: a narrow, read-only directory of coaches, exposing only what a
-- member needs to pick one (id, name, photo, active status) — never
-- email, phone, balance, or internal notes. Same pattern already used
-- by is_staff()/my_user_id() in gym.sql: a SECURITY DEFINER function
-- owned by a role that isn't subject to RLS on public.users, so it can
-- read trainer rows on the member's behalf without opening up direct
-- table access to those rows. This does not change any existing RLS
-- policy or grant broader table access — public.users stays exactly
-- as locked down as before.
-- ============================================================

create or replace function available_coaches()
returns table (id uuid, full_name text, avatar text, status text)
language sql
stable
security definer
set search_path = public
as $$
  select id, full_name, avatar, status
  from public.users
  where status <> 'suspended'
  and roles && array['trainer']::text[];
$$;

revoke execute on function available_coaches() from public;
grant execute on function available_coaches() to authenticated;

-- ============================================================
-- Verify:
-- 1. As a plain member (not staff), run:
--      select * from available_coaches();
--    Should return every active trainer's id/full_name/avatar/status
--    — but selecting directly from `users` for a trainer's id should
--    still return nothing (confirms the base table stays locked down).
-- 2. As that same member, confirm the returned columns really are
--    just id/full_name/avatar/status — no email, phone, balance, or
--    internal_notes anywhere in the result.
-- 3. As an anonymous (logged-out) session, calling available_coaches()
--    should fail with a permission error, not return data.
-- ============================================================
