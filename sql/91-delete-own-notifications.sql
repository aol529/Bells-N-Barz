-- ============================================================
-- MEMBERS CAN DELETE THEIR OWN NOTIFICATIONS
-- Run after 12-notifications-delete-policy.sql. Safe to re-run.
--
-- Until now only staff could delete notifications (sql/12). The Android
-- app's Notifications screen lets a member delete one, or clear all the
-- read ones; this policy lets that reach the database. A member can only
-- ever delete rows addressed to them.
-- ============================================================

drop policy if exists "users delete own notifications" on public.notifications;
create policy "users delete own notifications"
  on public.notifications for delete
  using (user_id = my_user_id());

grant delete on public.notifications to authenticated;

-- Verify (signed in as a member): delete one of your own notifications —
-- it goes; try someone else's id — nothing is deleted.
