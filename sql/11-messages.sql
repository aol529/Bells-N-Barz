-- ============================================================
-- MESSAGING (Member <-> Staff)
-- One thread per member, "Staff" collectively as the other party — any
-- coach/admin can see and reply, same "staff = broad access" pattern as
-- every other table in this app. Not 1:1 with a specific named trainer:
-- users.trainer is a free-text display name, never matched back to a
-- real staff user_id anywhere in this codebase, so there's no reliable
-- way to resolve "which staff account is this member's coach."
--
-- Follows 06-accountability-groups.sql's established shape for "member
-- interacts with people who aren't just themselves": SELECT-only direct
-- RLS, all writes through a security-definer RPC. A member can't be
-- allowed to insert into notifications directly (09-notifications.sql's
-- INSERT policy is staff-only), so the send has to happen server-side
-- anyway — same reasoning applies to the message/thread rows themselves.
-- ============================================================

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.users(id),
  last_sender_is_staff boolean,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  sender_is_staff boolean not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_thread_id on public.messages(thread_id);

alter table public.message_threads enable row level security;
alter table public.messages enable row level security;

-- security definer helper: the caller's own thread id, or null. Lets the
-- messages SELECT policy stay a one-liner with no self-referencing
-- subquery (it queries message_threads, a different table — no
-- recursion risk, unlike a naive policy that queries its own table).
create or replace function my_thread_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.message_threads where member_id = my_user_id();
$$;

drop policy if exists "read own thread or staff" on public.message_threads;
create policy "read own thread or staff"
  on public.message_threads for select
  using (member_id = my_user_id() or is_staff());

drop policy if exists "read own thread messages or staff" on public.messages;
create policy "read own thread messages or staff"
  on public.messages for select
  using (is_staff() or thread_id = my_thread_id());

-- No direct insert/update/delete policies on either table — every write
-- goes through send_message() below, which bypasses RLS on its own
-- inserts as a security-definer function.

create or replace function send_message(p_member_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  caller_staff boolean;
  target_member uuid;
  caller_name text;
  found_thread uuid;
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;
  if trim(coalesce(p_body, '')) = '' then
    raise exception 'Message cannot be empty.';
  end if;

  caller_staff := is_staff();

  if caller_staff then
    if p_member_id is null then
      raise exception 'A member must be specified.';
    end if;
    target_member := p_member_id;
  else
    target_member := caller;
  end if;

  select id into found_thread from public.message_threads where member_id = target_member;
  if found_thread is null then
    insert into public.message_threads (member_id) values (target_member)
    returning id into found_thread;
  end if;

  insert into public.messages (thread_id, sender_id, sender_is_staff, body)
  values (found_thread, caller, caller_staff, trim(p_body));

  update public.message_threads
  set updated_at = now(), last_sender_is_staff = caller_staff
  where id = found_thread;

  select full_name into caller_name from public.users where id = caller;

  if caller_staff then
    insert into public.notifications (user_id, type, message, link_tab)
    values (target_member, 'new_message', coalesce(caller_name, 'Your coach') || ' sent you a message.', 'messages');
  else
    insert into public.notifications (user_id, type, message, link_tab)
    select id, 'new_message', coalesce(caller_name, 'A member') || ' sent a message.', 'coach'
    from public.users
    where roles && array['admin','trainer','staff']::text[];
  end if;

  return found_thread;
end;
$$;

-- ============================================================
-- Verify:
-- 1. As a member with no prior thread, send_message(null, 'hello') —
--    confirm it creates a message_threads row and a messages row, and
--    every staff user gets a 'new_message' notification.
-- 2. As staff, send_message(<that member's id>, 'reply') — confirm it
--    reuses the same thread (no duplicate), updates last_sender_is_staff
--    to true, and the member gets a 'new_message' notification.
-- 3. As that member, select from messages where thread_id = my_thread_id()
--    — confirm both messages are visible.
-- 4. As a different, unrelated member, confirm the same select returns
--    nothing (my_thread_id() is null for them, RLS blocks the row).
-- ============================================================
