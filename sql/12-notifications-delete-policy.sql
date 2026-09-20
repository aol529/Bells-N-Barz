-- ============================================================
-- NOTIFICATIONS: STAFF DELETE POLICY
-- 09-notifications.sql only defined SELECT/INSERT/UPDATE policies —
-- under RLS, no policy for a command means that command is silently
-- denied for everyone (a client-side delete "succeeds" with 0 rows
-- affected, no error). Discovered while cleaning up test notification
-- rows from staging: even is_staff() couldn't delete a row directly,
-- only a superuser session (the SQL editor) could. This adds the
-- missing policy so staff can clear notifications from the app itself.
-- ============================================================

drop policy if exists "staff can delete notifications" on public.notifications;
create policy "staff can delete notifications"
  on public.notifications for delete
  using (is_staff());

-- ============================================================
-- Verify:
-- 1. As staff, delete a notification row directly
--    (bnbClient.from('notifications').delete().eq('id', <some id>)) —
--    should now succeed instead of silently affecting 0 rows.
-- 2. As a plain member, attempt the same delete on their own
--    notification — should still fail (no member-facing delete
--    policy exists, and none is being added here).
-- ============================================================
