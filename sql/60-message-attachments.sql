-- ============================================================
-- FILE & PHOTO SHARING IN MESSAGES
-- Run after 59-group-chats.sql. Safe to re-run.
--
-- Storage: a PRIVATE bucket, message-files (10 MB per file; photos,
-- PDFs, Office documents, text/CSV only). Files live under the uploader's
-- own folder, <users.id>/<random>-<name>. Nobody gets a public link: the
-- app asks for short-lived signed URLs, which Storage only issues if the
-- policies below allow the reader to see the file:
--   - upload: only into your own folder
--   - read:   your own files, or a file attached to a message you're
--             allowed to read (the DM's two people, a group's members,
--             a member's thread + staff — same rules as the messages)
--
-- Messages: dm_messages, messages and chat_group_messages each get an
-- optional attachment (jsonb: path, name, size, type). The three send
-- functions take it as an optional third argument; a message can be just
-- a file. They check the file is really yours and really uploaded.
-- ============================================================

-- ---------------- Bucket ----------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-files', 'message-files', false, 10485760, array[
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf', 'text/plain', 'text/csv',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ---------------- Message columns ----------------
alter table public.dm_messages add column if not exists attachment jsonb;
alter table public.messages add column if not exists attachment jsonb;
alter table public.chat_group_messages add column if not exists attachment jsonb;
create index if not exists idx_dm_messages_attachment on public.dm_messages ((attachment->>'path')) where attachment is not null;
create index if not exists idx_messages_attachment on public.messages ((attachment->>'path')) where attachment is not null;
create index if not exists idx_chat_group_messages_attachment on public.chat_group_messages ((attachment->>'path')) where attachment is not null;

-- ---------------- Checks ----------------
-- Is this attachment the caller's own, really uploaded, and sane?
create or replace function message_attachment_ok(p_att jsonb)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_att is not null
    and jsonb_typeof(p_att) = 'object'
    and split_part(p_att->>'path', '/', 1) = my_user_id()::text
    and char_length(coalesce(p_att->>'name', '')) between 1 and 200
    and coalesce((p_att->>'size')::bigint, 0) between 1 and 10485760
    and char_length(coalesce(p_att->>'type', '')) between 1 and 100
    and exists (select 1 from storage.objects o where o.bucket_id = 'message-files' and o.name = p_att->>'path');
$$;

-- Can the caller see a message that has this file attached?
create or replace function can_read_message_file(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
      select 1 from public.dm_messages m join public.dm_threads t on t.id = m.thread_id
      where m.attachment->>'path' = p_path
        and (t.user_a = my_user_id() or t.user_b = my_user_id() or is_staff()))
    or exists (
      select 1 from public.messages m
      where m.attachment->>'path' = p_path and (is_staff() or m.thread_id = my_thread_id()))
    or exists (
      select 1 from public.chat_group_messages m
      where m.attachment->>'path' = p_path and is_chat_group_member(m.group_id));
$$;

-- ---------------- Storage policies ----------------
drop policy if exists "message files: upload to own folder" on storage.objects;
create policy "message files: upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'message-files' and (storage.foldername(name))[1] = my_user_id()::text);

drop policy if exists "message files: read own or shared with me" on storage.objects;
create policy "message files: read own or shared with me" on storage.objects for select to authenticated
  using (bucket_id = 'message-files'
         and ((storage.foldername(name))[1] = my_user_id()::text or can_read_message_file(name)));

-- ---------------- Send functions (now with an optional attachment) ----------------
-- Same as before (sql/11, sql/14, sql/59) apart from: an attachment can be
-- passed, the text may then be empty, and the notification says what was
-- sent. The old two-argument versions are dropped so calls stay
-- unambiguous; existing two-argument calls still work via the default.

drop function if exists send_direct_message(uuid, text);
create or replace function send_direct_message(p_recipient_id uuid, p_body text, p_attachment jsonb default null)
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
  what text;
begin
  if caller is null then raise exception 'Not signed in.'; end if;
  if p_recipient_id is null then raise exception 'A recipient is required.'; end if;
  if p_recipient_id = caller then raise exception 'You cannot message yourself.'; end if;
  if not exists (select 1 from public.users where id = p_recipient_id) then raise exception 'That user could not be found.'; end if;
  if p_attachment is not null and not message_attachment_ok(p_attachment) then raise exception 'That file could not be attached.'; end if;
  if trim(coalesce(p_body, '')) = '' and p_attachment is null then raise exception 'Message cannot be empty.'; end if;

  lo := least(caller, p_recipient_id);
  hi := greatest(caller, p_recipient_id);
  select id into found_thread from public.dm_threads where user_a = lo and user_b = hi;
  if found_thread is null then
    insert into public.dm_threads (user_a, user_b) values (lo, hi) returning id into found_thread;
  end if;

  insert into public.dm_messages (thread_id, sender_id, body, attachment)
  values (found_thread, caller, trim(coalesce(p_body, '')), p_attachment);
  update public.dm_threads set updated_at = now(), last_sender_id = caller where id = found_thread;

  select full_name into caller_name from public.users where id = caller;
  what := case when p_attachment is null then 'a message'
               when p_attachment->>'type' like 'image/%' then 'a photo' else 'a file' end;
  insert into public.notifications (user_id, type, message, link_tab)
  values (p_recipient_id, 'new_direct_message', coalesce(caller_name, 'Someone') || ' sent you ' || what || '.', 'inbox');
  return found_thread;
end;
$$;

drop function if exists send_message(uuid, text);
create or replace function send_message(p_member_id uuid, p_body text, p_attachment jsonb default null)
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
  what text;
begin
  if caller is null then raise exception 'Not signed in.'; end if;
  if p_attachment is not null and not message_attachment_ok(p_attachment) then raise exception 'That file could not be attached.'; end if;
  if trim(coalesce(p_body, '')) = '' and p_attachment is null then raise exception 'Message cannot be empty.'; end if;

  caller_staff := is_staff();
  if caller_staff then
    if p_member_id is null then raise exception 'A member must be specified.'; end if;
    target_member := p_member_id;
  else
    target_member := caller;
  end if;

  select id into found_thread from public.message_threads where member_id = target_member;
  if found_thread is null then
    insert into public.message_threads (member_id) values (target_member) returning id into found_thread;
  end if;

  insert into public.messages (thread_id, sender_id, sender_is_staff, body, attachment)
  values (found_thread, caller, caller_staff, trim(coalesce(p_body, '')), p_attachment);
  update public.message_threads set updated_at = now(), last_sender_is_staff = caller_staff where id = found_thread;

  select full_name into caller_name from public.users where id = caller;
  what := case when p_attachment is null then 'a message'
               when p_attachment->>'type' like 'image/%' then 'a photo' else 'a file' end;
  if caller_staff then
    insert into public.notifications (user_id, type, message, link_tab)
    values (target_member, 'new_message', coalesce(caller_name, 'Your coach') || ' sent you ' || what || '.', 'messages');
  else
    insert into public.notifications (user_id, type, message, link_tab)
    select id, 'new_message', coalesce(caller_name, 'A member') || ' sent ' || what || '.', 'coach'
    from public.users
    where roles && array['admin','trainer','staff']::text[];
  end if;
  return found_thread;
end;
$$;

drop function if exists send_group_message(uuid, text);
create or replace function send_group_message(p_group_id uuid, p_body text, p_attachment jsonb default null)
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
  what text;
begin
  if me is null then raise exception 'Not signed in.'; end if;
  if not is_chat_group_member(p_group_id) then raise exception 'You''re not in that group.'; end if;
  if p_attachment is not null and not message_attachment_ok(p_attachment) then raise exception 'That file could not be attached.'; end if;
  if trim(coalesce(p_body, '')) = '' and p_attachment is null then raise exception 'Message cannot be empty.'; end if;

  insert into public.chat_group_messages (group_id, sender_id, body, attachment)
    values (p_group_id, me, trim(coalesce(p_body, '')), p_attachment) returning id into mid;
  update public.chat_groups set updated_at = now(), last_sender_id = me
    where id = p_group_id returning name into gname;
  update public.chat_group_members set read_at = now()
    where group_id = p_group_id and user_id = me;

  select full_name into my_name from public.users where id = me;
  what := case when p_attachment is null then 'a message'
               when p_attachment->>'type' like 'image/%' then 'a photo' else 'a file' end;
  insert into public.notifications (user_id, type, message, link_tab)
    select user_id, 'new_group_message', coalesce(my_name, 'Someone') || ' sent ' || what || ' in "' || gname || '".', 'inbox'
    from public.chat_group_members where group_id = p_group_id and user_id <> me;
  return mid;
end;
$$;
