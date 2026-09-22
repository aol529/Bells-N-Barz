-- ============================================================
-- INBOX — direct 1:1 messaging between ANY two users
-- Unlike 11-messages.sql (one pooled member<->"all staff" support
-- thread), this is a general-purpose inbox: any member, trainer, or
-- admin can message any other user directly, staff included. The two
-- systems are deliberately separate and both stay live — this doesn't
-- replace the support thread, which is still the right tool for "member
-- needs help, any staff can pick it up."
--
-- Same "RPC-only writes" shape as 06-accountability-groups.sql /
-- 11-messages.sql: SELECT-only direct RLS, every write goes through
-- send_direct_message() below. Threads are deduplicated per unordered
-- pair via a (user_a, user_b) unique constraint with user_a always the
-- lexicographically smaller uuid — send_direct_message() normalizes the
-- pair with least()/greatest() before the find-or-create lookup, so
-- messaging someone always lands in the same thread regardless of who
-- started it.
--
-- Search for who to message reuses accountability_search_members() from
-- 06-accountability-groups.sql as-is — it already searches every user
-- (no role filter, excludes self and suspended accounts), which is
-- exactly "anyone" here too. No new search RPC needed.
--
-- Run after 06-accountability-groups.sql and 09-notifications.sql
-- (needs is_staff()/my_user_id(), accountability_search_members(), and
-- the notifications table).
-- ============================================================

create table if not exists public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.users(id),
  user_b uuid not null references public.users(id),
  last_sender_id uuid references public.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a <> user_b)
);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_dm_messages_thread_id on public.dm_messages(thread_id);

alter table public.dm_threads enable row level security;
alter table public.dm_messages enable row level security;

drop policy if exists "read own dm threads or staff" on public.dm_threads;
create policy "read own dm threads or staff"
  on public.dm_threads for select
  using (user_a = my_user_id() or user_b = my_user_id() or is_staff());

drop policy if exists "read own dm messages or staff" on public.dm_messages;
create policy "read own dm messages or staff"
  on public.dm_messages for select
  using (
    is_staff()
    or thread_id in (
      select id from public.dm_threads
      where user_a = my_user_id() or user_b = my_user_id()
    )
  );

-- No direct insert/update/delete policies on either table — every write
-- goes through send_direct_message() below, which bypasses RLS on its
-- own inserts as a security-definer function (same reasoning as
-- send_message() in 11-messages.sql).

-- ---------------- RPC: my conversations, with the other person's name/avatar joined in ----------------
-- A plain member can only SELECT their own row from public.users (see
-- gym.sql), so the thread list can't resolve "who am I talking to" on
-- the client — this does that join server-side instead, same shape as
-- accountability_my_groups().

create or replace function my_dm_threads()
returns table (
  thread_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message text,
  last_sender_id uuid,
  updated_at timestamptz
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
    t.updated_at
  from public.dm_threads t
  join public.users other
    on other.id = (case when t.user_a = my_user_id() then t.user_b else t.user_a end)
  where t.user_a = my_user_id() or t.user_b = my_user_id()
  order by t.updated_at desc;
$$;

-- ---------------- RPC: send a direct message ----------------

create or replace function send_direct_message(p_recipient_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  caller_name text;
  lo uuid;
  hi uuid;
  found_thread uuid;
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;
  if p_recipient_id is null then
    raise exception 'A recipient is required.';
  end if;
  if p_recipient_id = caller then
    raise exception 'You cannot message yourself.';
  end if;
  if not exists (select 1 from public.users where id = p_recipient_id) then
    raise exception 'That user could not be found.';
  end if;
  if trim(coalesce(p_body, '')) = '' then
    raise exception 'Message cannot be empty.';
  end if;

  lo := least(caller, p_recipient_id);
  hi := greatest(caller, p_recipient_id);

  select id into found_thread from public.dm_threads where user_a = lo and user_b = hi;
  if found_thread is null then
    insert into public.dm_threads (user_a, user_b) values (lo, hi)
    returning id into found_thread;
  end if;

  insert into public.dm_messages (thread_id, sender_id, body)
  values (found_thread, caller, trim(p_body));

  update public.dm_threads
  set updated_at = now(), last_sender_id = caller
  where id = found_thread;

  select full_name into caller_name from public.users where id = caller;

  insert into public.notifications (user_id, type, message, link_tab)
  values (p_recipient_id, 'new_direct_message', coalesce(caller_name, 'Someone') || ' sent you a message.', 'inbox');

  return found_thread;
end;
$$;

-- ============================================================
-- Verify:
-- 1. As Member A (no prior thread with B), send_direct_message(<B's id>,
--    'hey') — confirm a dm_threads row appears (user_a/user_b sorted),
--    a dm_messages row appears, and B gets a 'new_direct_message'
--    notification.
-- 2. As B, send_direct_message(<A's id>, 'hey back') — confirm it
--    reuses the SAME thread (no duplicate row), updates last_sender_id
--    to B, and A gets a notification.
-- 3. As A, select * from my_dm_threads() — confirm one row, with
--    other_user_id/other_user_name resolving to B even though A can't
--    otherwise SELECT B's row from public.users directly.
-- 4. As a third, unrelated member C, confirm select * from dm_threads
--    where id = <that thread> returns nothing (RLS blocks it), and
--    send_direct_message(<A's id>, 'hi') creates a SEPARATE thread.
-- 5. As A, send_direct_message(<A's own id>, 'hi') — confirm it raises
--    'You cannot message yourself.'
-- 6. As staff, select * from dm_threads — confirm every thread is
--    visible (is_staff() broad-access clause).
-- ============================================================
