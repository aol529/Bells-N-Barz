-- ============================================================
-- MESSAGE REACTIONS (👍 ❤️ 😂 💪 🔥 🙏 on any message)
-- Run after 57-realtime-notifications.sql. Safe to re-run.
--
-- One table per message system, since they're separate tables:
--   dm_message_reactions   Inbox (dm_messages)
--   message_reactions      Member <-> staff Messages (messages)
-- One row per (message, person, emoji). Deleting a message deletes its
-- reactions.
--
-- Reading follows the messages' own rules (the two people in a DM, the
-- member and staff for a member thread — plus staff for both, same as
-- the messages). There are no insert/delete policies: changes only go
-- through the toggle functions below, which check the caller is part of
-- that conversation and only accept the six emoji the app offers.
-- ============================================================

create table if not exists public.dm_message_reactions (
  message_id uuid not null references public.dm_messages(id) on delete cascade,
  user_id uuid not null references public.users(id),
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id),
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

alter table public.dm_message_reactions enable row level security;
alter table public.message_reactions enable row level security;

drop policy if exists "read reactions on dms I can read" on public.dm_message_reactions;
create policy "read reactions on dms I can read"
  on public.dm_message_reactions for select
  using (exists (
    select 1 from public.dm_messages m
    join public.dm_threads t on t.id = m.thread_id
    where m.id = message_id
      and (t.user_a = my_user_id() or t.user_b = my_user_id() or is_staff())
  ));

drop policy if exists "read reactions on messages I can read" on public.message_reactions;
create policy "read reactions on messages I can read"
  on public.message_reactions for select
  using (exists (
    select 1 from public.messages m
    where m.id = message_id
      and (is_staff() or m.thread_id = my_thread_id())
  ));

grant all on public.dm_message_reactions to anon, authenticated, service_role;
grant all on public.message_reactions to anon, authenticated, service_role;

-- The only emoji the app offers. Keep in step with REACTION_EMOJI in
-- js/bells-n-barz-shell.js (❤️ includes its U+FE0F variation selector).
create or replace function reaction_emoji_allowed(p_emoji text)
returns boolean
language sql
immutable
as $$
  select p_emoji = any (array['👍', '❤️', '😂', '💪', '🔥', '🙏']);
$$;

-- Inbox: add my reaction if it isn't there, remove it if it is.
-- Returns true when added, false when removed. Only the two people in the
-- conversation can react (staff can read others' DMs, but not react).
create or replace function toggle_dm_reaction(p_message_id uuid, p_emoji text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
begin
  if me is null then raise exception 'Not signed in.'; end if;
  if not reaction_emoji_allowed(p_emoji) then raise exception 'That reaction isn''t available.'; end if;
  if not exists (
    select 1 from public.dm_messages m
    join public.dm_threads t on t.id = m.thread_id
    where m.id = p_message_id and (t.user_a = me or t.user_b = me)
  ) then
    raise exception 'Message not found.';
  end if;

  delete from public.dm_message_reactions
  where message_id = p_message_id and user_id = me and emoji = p_emoji;
  if found then return false; end if;

  insert into public.dm_message_reactions (message_id, user_id, emoji)
  values (p_message_id, me, p_emoji);
  return true;
end;
$$;

-- Member <-> staff Messages: the member on their own thread, or any staff.
create or replace function toggle_message_reaction(p_message_id uuid, p_emoji text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
begin
  if me is null then raise exception 'Not signed in.'; end if;
  if not reaction_emoji_allowed(p_emoji) then raise exception 'That reaction isn''t available.'; end if;
  if not exists (
    select 1 from public.messages m
    where m.id = p_message_id and (is_staff() or m.thread_id = my_thread_id())
  ) then
    raise exception 'Message not found.';
  end if;

  delete from public.message_reactions
  where message_id = p_message_id and user_id = me and emoji = p_emoji;
  if found then return false; end if;

  insert into public.message_reactions (message_id, user_id, emoji)
  values (p_message_id, me, p_emoji);
  return true;
end;
$$;
