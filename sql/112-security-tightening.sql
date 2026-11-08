-- ============================================================
-- SECURITY TIGHTENING (from the 2026-11-08 review, sql/check-security-full.sql)
-- Safe to re-run.
--
-- 1. meal_plan_notify_staff() puts a notification in a coach's or admin's
--    bell with any member's name and any text. Only the meal-plan and
--    diet triggers should call it (they run as the database owner), but
--    like every function it was callable by anyone, even signed out, so
--    someone could have filled staff bells with fake "member" messages.
--    Nobody but the owner may call it now.
-- 2. checkin_streak() and has_trained_with() told a signed-out caller a
--    member's streak and who they've trained with. Signed-in only now
--    (the coach-rating rules use has_trained_with, so members keep it).
-- ============================================================

revoke all on function meal_plan_notify_staff(uuid, text, text) from public, anon, authenticated;

revoke all on function checkin_streak(uuid) from public, anon;
grant execute on function checkin_streak(uuid) to authenticated;

revoke all on function has_trained_with(uuid, uuid) from public, anon;
grant execute on function has_trained_with(uuid, uuid) to authenticated;
