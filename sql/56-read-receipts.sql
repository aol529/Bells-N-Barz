-- ============================================================
-- READ RECEIPTS ("Seen 10:05" under your last message)
-- Run after 55-inbox-unread.sql. Safe to re-run.
--
-- Inbox (dm_threads) already records when each person last opened a
-- conversation (a_read_at / b_read_at, from sql/55); my_dm_threads() now
-- also returns the OTHER person's time, so you can see when they read
-- your message.
--
-- Member <-> staff Messages (message_threads) gets the same idea:
--   member_read_at   when the member last opened their thread
--   staff_read_at    when any staff member last opened it
-- Both are plain columns, readable through the existing "read own thread
-- or staff" policy, and only written through mark_message_thread_read(),
-- which sets the caller's own side and nothing else.
-- ============================================================

alter table public.message_threads add column if not exists member_read_at timestamptz;
alter table public.message_threads add column if not exists staff_read_at timestamptz;

create or replace function mark_message_thread_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_staff() then
    update public.message_threads set staff_read_at = now() where id = p_thread_id;
  else
    update public.message_threads set member_read_at = now()
    where id = p_thread_id and member_id = my_user_id();
  end if;
end;
$$;

-- Inbox: add other_read_at. The result columns change, so drop first.
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
  unread boolean,
  other_read_at timestamptz
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
    -- Unread: the other person spoke last, after I last opened it (sql/55).
    (t.last_sender_id is not null
      and t.last_sender_id <> my_user_id()
      and t.updated_at > coalesce(
        case when t.user_a = my_user_id() then t.a_read_at else t.b_read_at end,
        '-infinity'::timestamptz)),
    -- When the other person last opened it (for "Seen" on my messages).
    case when t.user_a = my_user_id() then t.b_read_at else t.a_read_at end
  from public.dm_threads t
  join public.users other
    on other.id = (case when t.user_a = my_user_id() then t.user_b else t.user_a end)
  where t.user_a = my_user_id() or t.user_b = my_user_id()
  order by t.updated_at desc;
$$;
