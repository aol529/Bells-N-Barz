-- ============================================================
-- FIX: programs table should only be readable by its owner
-- (the member whose program it is) and staff/coaches — not
-- literally anyone with the anon key.
-- ============================================================

-- Remove the overly broad policy.
drop policy if exists "anyone can read programs" on programs;

-- Replace with owner-or-staff read access, matching the pattern
-- already used correctly on hep_progression_store and weight_log.
create policy "owner or staff can read programs"
on programs
for select
using (owner_id = my_user_id() or is_staff());

-- ============================================================
-- Verify:
-- 1. As a logged-in member, confirm you can still see your own
--    program:
--      select * from programs where owner_id = auth.uid();  -- adjust to my_user_id() equivalent as needed
--    (should return rows)
--
-- 2. As that same member, confirm you can NOT see another
--    member's program by id:
--      select * from programs where owner_id = '<some other user's id>';
--    (should return zero rows, not an error — RLS just filters silently)
--
-- 3. As staff, confirm you can still see everyone's:
--      select count(*) from programs;
--    (should match the total row count, not just your own)
-- ============================================================
