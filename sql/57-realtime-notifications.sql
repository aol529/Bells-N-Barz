-- ============================================================
-- REALTIME NOTIFICATIONS (instant message alerts with sound)
-- Run after 56-read-receipts.sql. Safe to re-run.
--
-- Adds public.notifications to Supabase Realtime's publication, so the
-- app hears a new notification the moment it's inserted (send_message /
-- send_direct_message already insert one for every message) instead of
-- waiting for the bell's 90-second check. The app then plays a chime,
-- shows a pop-up and refreshes the conversation.
--
-- Realtime applies the table's RLS to each subscriber ("users read own
-- notifications"), and the app also filters to its own user_id, so
-- nobody is sent anyone else's notifications.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

-- Check: should return one row.
-- select * from pg_publication_tables
-- where pubname = 'supabase_realtime' and tablename = 'notifications';
