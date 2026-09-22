-- ============================================================
-- EKADASHI REMINDERS: dedup log for the automatic 24h-before Inbox message
-- The Ekadashi timer (Me > Moon tab) sends every member a reminder via
-- the Inbox (sql/14-inbox.sql's dm_threads/dm_messages) once the
-- countdown to the next Ekadashi enters its final 24 hours. Same
-- underlying limitation as the birthday notifications (see the
-- checkBirthdaysAndNotify() comment in the main file): there's no
-- scheduled job in this project, so this only actually fires when SOME
-- staff member has the app open (or opens it) during that 24h window —
-- and since it could be a DIFFERENT staff member each time (the
-- reminder is sent as a direct message FROM whichever staff account
-- happens to trigger the check, since dm_messages has no "system
-- sender" concept), a simple "did I already send this" check isn't
-- enough to prevent duplicates — two different staff members opening
-- the app in the same window would each fire it. This table is the
-- cross-session, cross-staff dedup key: one row per (member, specific
-- Ekadashi occurrence), inserted right before the send, so whichever
-- staff session gets there first "claims" it and every later attempt
-- (same staff or different) sees the conflict and skips.
--
-- Not member-facing — staff-only bookkeeping, same access shape as the
-- rest of this schema. Run after gym.sql and 14-inbox.sql (needs
-- is_staff()/my_user_id() and send_direct_message()).
-- ============================================================

create table if not exists public.ekadashi_reminders_sent (
  member_id uuid not null references public.users(id),
  ekadashi_start timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (member_id, ekadashi_start)
);

alter table public.ekadashi_reminders_sent enable row level security;

drop policy if exists "staff can read reminder log" on public.ekadashi_reminders_sent;
create policy "staff can read reminder log"
  on public.ekadashi_reminders_sent for select
  using (is_staff());

drop policy if exists "staff can claim a reminder slot" on public.ekadashi_reminders_sent;
create policy "staff can claim a reminder slot"
  on public.ekadashi_reminders_sent for insert
  with check (is_staff());

-- ============================================================
-- Verify:
-- 1. As staff A, insert (member_id, ekadashi_start) — succeeds.
-- 2. As staff B (or A again), insert the SAME (member_id,
--    ekadashi_start) pair — fails on the primary key conflict, which
--    the client reads as "already claimed" and skips the send.
-- 3. As a plain member, confirm insert is refused (is_staff() check).
-- ============================================================
