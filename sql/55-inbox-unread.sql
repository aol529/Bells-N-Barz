-- ============================================================
-- INBOX UNREAD COUNT
-- Run after 14-inbox.sql. Safe to re-run.
--
-- dm_threads knew who sent the last message but not when each person
-- last read the conversation, so the app could only show "New" (they
-- spoke last) — which stayed on even after you'd read it. This adds a
-- per-person "read up to" time, so the INBOX button can show a real
-- unread count that clears on every device once you open the thread.
--
--   a_read_at / b_read_at   when user_a / user_b last opened the thread
--   my_dm_threads()         now also returns `unread` (boolean)
--   mark_dm_thread_read()   sets the caller's read time to now()
--
-- Until this runs, the app tracks reads per device instead.
-- ============================================================

alter table public.dm_threads add column if not exists a_read_at timestamptz;
alter table public.dm_threads add column if not exists b_read_at timestamptz;

-- The return columns change, so the function has to be dropped first
-- (CREATE OR REPLACE can't change a function's result type).
drop function if exists my_dm_threads();
create function my_dm_threads()
returns table (
  thread_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message text,
  last_sender_id uuid,
  updated_at timestamptz,
  unread boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    other.id,
    other.full_name,
    other.avatar,
    (select m.body from public.dm_messages m where m.thread_id = t.id order by m.created_at desc limit 1),
    t.last_sender_id,
    t.updated_at,
    -- Unread: the other person spoke last, after I last opened it.
    (t.last_sender_id is not null
      and t.last_sender_id <> my_user_id()
      and t.updated_at > coalesce(
        case when t.user_a = my_user_id() then t.a_read_at else t.b_read_at end,
        '-infinity'::timestamptz))
  from public.dm_threads t
  join public.users other
    on other.id = (case when t.user_a = my_user_id() then t.user_b else t.user_a end)
  where t.user_a = my_user_id() or t.user_b = my_user_id()
  order by t.updated_at desc;
$$;

-- Marks a thread read for the caller only, and only if they're in it.
create or replace function mark_dm_thread_read(p_thread_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.dm_threads
  set a_read_at = case when user_a = my_user_id() then now() else a_read_at end,
      b_read_at = case when user_b = my_user_id() then now() else b_read_at end
  where id = p_thread_id
    and (user_a = my_user_id() or user_b = my_user_id());
$$;

-- Check (signed in as a member with a conversation):
-- select thread_id, other_user_name, unread from my_dm_threads();
