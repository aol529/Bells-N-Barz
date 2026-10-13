-- ============================================================
-- GROUP CHATS (Inbox)
-- Run after 58-message-reactions.sql (uses reaction_emoji_allowed()).
-- Safe to re-run.
--
--   chat_groups           a named group; updated_at / last_sender_id move
--                         with every message (like dm_threads)
--   chat_group_members    who's in it, their role (owner/member) and how
--                         far they've read (read_at)
--   chat_group_messages   the messages; sender_id null = a system note
--                         ("Alice added Bob")
--   chat_group_reactions  emoji reactions, same six as everywhere else
--
-- Only members can read a group, its members, messages and reactions.
-- There are no insert/update/delete policies: every change goes through
-- the functions below, which check membership first. Messages and
-- "added you" both create a notification, so the live chime/pop-up
-- (sql/57) works for groups too. Archived/suspended people can't be added.
-- ============================================================

create table if not exists public.chat_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.users(id),
  last_sender_id uuid references public.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_group_members (
  group_id uuid not null references public.chat_groups(id) on delete cascade,
  user_id uuid not null references public.users(id),
  role text not null default 'member' check (role in ('owner', 'member')),
  read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists idx_chat_group_members_user on public.chat_group_members(user_id);

create table if not exists public.chat_group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.chat_groups(id) on delete cascade,
  sender_id uuid references public.users(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_group_messages_group on public.chat_group_messages(group_id, created_at);

create table if not exists public.chat_group_reactions (
  message_id uuid not null references public.chat_group_messages(id) on delete cascade,
  user_id uuid not null references public.users(id),
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

-- ---------------- Access ----------------
create or replace function is_chat_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.chat_group_members
                 where group_id = p_group_id and user_id = my_user_id());
$$;

alter table public.chat_groups enable row level security;
alter table public.chat_group_members enable row level security;
alter table public.chat_group_messages enable row level security;
alter table public.chat_group_reactions enable row level security;

drop policy if exists "members read their groups" on public.chat_groups;
create policy "members read their groups" on public.chat_groups for select
  using (is_chat_group_member(id));
drop policy if exists "members read group membership" on public.chat_group_members;
create policy "members read group membership" on public.chat_group_members for select
  using (is_chat_group_member(group_id));
drop policy if exists "members read group messages" on public.chat_group_messages;
create policy "members read group messages" on public.chat_group_messages for select
  using (is_chat_group_member(group_id));
drop policy if exists "members read group reactions" on public.chat_group_reactions;
create policy "members read group reactions" on public.chat_group_reactions for select
  using (exists (select 1 from public.chat_group_messages m
                 where m.id = message_id and is_chat_group_member(m.group_id)));

grant all on public.chat_groups, public.chat_group_members, public.chat_group_messages, public.chat_group_reactions
  to anon, authenticated, service_role;

-- ---------------- Reading ----------------
-- My groups for the Inbox list (newest first), with an unread flag like
-- my_dm_threads().
drop function if exists my_chat_groups();
create function my_chat_groups()
returns table (
  group_id uuid,
  name text,
  member_count integer,
  last_message text,
  last_sender_id uuid,
  updated_at timestamptz,
  unread boolean,
  my_role text
)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.name,
    (select count(*) from public.chat_group_members x where x.group_id = g.id)::integer,
    (select m.body from public.chat_group_messages m where m.group_id = g.id order by m.created_at desc limit 1),
    g.last_sender_id,
    g.updated_at,
    (g.last_sender_id is not null and g.last_sender_id <> my_user_id()
      and g.updated_at > coalesce(me.read_at, '-infinity'::timestamptz)),
    me.role
  from public.chat_groups g
  join public.chat_group_members me on me.group_id = g.id and me.user_id = my_user_id()
  order by g.updated_at desc;
$$;

-- A group's members with names (members can't read other users' rows
-- directly) and how far each has read, for "Seen by 2 of 3".
create or replace function chat_group_member_list(p_group_id uuid)
returns table (user_id uuid, full_name text, role text, read_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select gm.user_id, u.full_name, gm.role, gm.read_at
  from public.chat_group_members gm
  join public.users u on u.id = gm.user_id
  where gm.group_id = p_group_id and is_chat_group_member(p_group_id)
  order by gm.role desc, u.full_name;
$$;

-- ---------------- Changing ----------------
-- Shared checks for people being added: real, active, not archived.
create or replace function chat_group_valid_people(p_ids uuid[])
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct u.id), '{}')
  from public.users u
  where u.id = any (p_ids) and u.status <> 'suspended' and u.id <> my_user_id();
$$;

create or replace function create_chat_group(p_name text, p_member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
  my_name text;
  people uuid[];
  gid uuid;
  clean_name text := trim(coalesce(p_name, ''));
begin
  if me is null then raise exception 'Not signed in.'; end if;
  if char_length(clean_name) < 1 or char_length(clean_name) > 60 then
    raise exception 'Give the group a name (up to 60 characters).';
  end if;
  people := chat_group_valid_people(p_member_ids);
  if coalesce(array_length(people, 1), 0) < 1 then raise exception 'Add at least one person.'; end if;
  if array_length(people, 1) > 49 then raise exception 'A group can have up to 50 people.'; end if;

  select full_name into my_name from public.users where id = me;
  insert into public.chat_groups (name, created_by) values (clean_name, me) returning id into gid;
  insert into public.chat_group_members (group_id, user_id, role, read_at) values (gid, me, 'owner', now());
  insert into public.chat_group_members (group_id, user_id) select gid, unnest(people);
  insert into public.chat_group_messages (group_id, sender_id, body)
    values (gid, null, coalesce(my_name, 'Someone') || ' created the group.');
  insert into public.notifications (user_id, type, message, link_tab)
    select unnest(people), 'group_added', coalesce(my_name, 'Someone') || ' added you to "' || clean_name || '".', 'inbox';
  return gid;
end;
$$;

create or replace function send_group_message(p_group_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
  my_name text;
  gname text;
  mid uuid;
begin
  if me is null then raise exception 'Not signed in.'; end if;
  if not is_chat_group_member(p_group_id) then raise exception 'You''re not in that group.'; end if;
  if trim(coalesce(p_body, '')) = '' then raise exception 'Message cannot be empty.'; end if;

  insert into public.chat_group_messages (group_id, sender_id, body)
    values (p_group_id, me, trim(p_body)) returning id into mid;
  update public.chat_groups set updated_at = now(), last_sender_id = me
    where id = p_group_id returning name into gname;
  update public.chat_group_members set read_at = now()
    where group_id = p_group_id and user_id = me;

  select full_name into my_name from public.users where id = me;
  insert into public.notifications (user_id, type, message, link_tab)
    select user_id, 'new_group_message', coalesce(my_name, 'Someone') || ' sent a message in "' || gname || '".', 'inbox'
    from public.chat_group_members where group_id = p_group_id and user_id <> me;
  return mid;
end;
$$;

-- Any member can add people (like most group chats).
create or replace function add_chat_group_members(p_group_id uuid, p_member_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
  my_name text;
  gname text;
  people uuid[];
  added_names text;
  n integer;
begin
  if me is null then raise exception 'Not signed in.'; end if;
  if not is_chat_group_member(p_group_id) then raise exception 'You''re not in that group.'; end if;
  select array_agg(p) into people from unnest(chat_group_valid_people(p_member_ids)) p
    where not exists (select 1 from public.chat_group_members where group_id = p_group_id and user_id = p);
  n := coalesce(array_length(people, 1), 0);
  if n = 0 then return 0; end if;
  if (select count(*) from public.chat_group_members where group_id = p_group_id) + n > 50 then
    raise exception 'A group can have up to 50 people.';
  end if;

  insert into public.chat_group_members (group_id, user_id) select p_group_id, unnest(people);
  select full_name into my_name from public.users where id = me;
  select name into gname from public.chat_groups where id = p_group_id;
  select string_agg(full_name, ', ' order by full_name) into added_names from public.users where id = any (people);
  insert into public.chat_group_messages (group_id, sender_id, body)
    values (p_group_id, null, coalesce(my_name, 'Someone') || ' added ' || added_names || '.');
  update public.chat_groups set updated_at = now() where id = p_group_id;
  insert into public.notifications (user_id, type, message, link_tab)
    select unnest(people), 'group_added', coalesce(my_name, 'Someone') || ' added you to "' || gname || '".', 'inbox';
  return n;
end;
$$;

create or replace function rename_chat_group(p_group_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
  my_name text;
  clean_name text := trim(coalesce(p_name, ''));
begin
  if me is null then raise exception 'Not signed in.'; end if;
  if not is_chat_group_member(p_group_id) then raise exception 'You''re not in that group.'; end if;
  if char_length(clean_name) < 1 or char_length(clean_name) > 60 then
    raise exception 'Give the group a name (up to 60 characters).';
  end if;
  select full_name into my_name from public.users where id = me;
  update public.chat_groups set name = clean_name, updated_at = now() where id = p_group_id;
  insert into public.chat_group_messages (group_id, sender_id, body)
    values (p_group_id, null, coalesce(my_name, 'Someone') || ' renamed the group to "' || clean_name || '".');
end;
$$;

-- Leaving: if the owner leaves, the longest-standing member takes over;
-- the last person out deletes the group (and its messages).
create or replace function leave_chat_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
  my_name text;
  was_owner boolean;
begin
  if me is null then raise exception 'Not signed in.'; end if;
  select role = 'owner' into was_owner from public.chat_group_members where group_id = p_group_id and user_id = me;
  if was_owner is null then raise exception 'You''re not in that group.'; end if;

  delete from public.chat_group_members where group_id = p_group_id and user_id = me;
  if not exists (select 1 from public.chat_group_members where group_id = p_group_id) then
    delete from public.chat_groups where id = p_group_id;
    return;
  end if;
  if was_owner then
    update public.chat_group_members set role = 'owner'
    where group_id = p_group_id and user_id = (
      select user_id from public.chat_group_members where group_id = p_group_id order by joined_at limit 1);
  end if;
  select full_name into my_name from public.users where id = me;
  insert into public.chat_group_messages (group_id, sender_id, body)
    values (p_group_id, null, coalesce(my_name, 'Someone') || ' left the group.');
  update public.chat_groups set updated_at = now() where id = p_group_id;
end;
$$;

create or replace function mark_chat_group_read(p_group_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.chat_group_members set read_at = now()
  where group_id = p_group_id and user_id = my_user_id();
$$;

create or replace function toggle_group_reaction(p_message_id uuid, p_emoji text)
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
  if not exists (select 1 from public.chat_group_messages m
                 where m.id = p_message_id and m.sender_id is not null and is_chat_group_member(m.group_id)) then
    raise exception 'Message not found.';
  end if;
  delete from public.chat_group_reactions where message_id = p_message_id and user_id = me and emoji = p_emoji;
  if found then return false; end if;
  insert into public.chat_group_reactions (message_id, user_id, emoji) values (p_message_id, me, p_emoji);
  return true;
end;
$$;
