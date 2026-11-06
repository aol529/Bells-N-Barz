-- ============================================================
-- COACHING-TEAM MESSAGES ONLY NOTIFY THE PEOPLE WHO NEED TO KNOW (ran on live 2026-11-06)
-- Run after 103-coach-colleagues-and-messages.sql. Safe to re-run.
--
-- A member's message used to tell all staff their name. It now goes to
-- the front office, the member's coach and any coach covering them.
-- ============================================================

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
    if not can_see_member(p_member_id) then raise exception 'That member isn''t one of your clients.'; end if;
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
    from public.users u
    where u.roles && array['admin','staff']::text[]
       or u.id = (select trainer_id from public.users where id = caller)
       or exists (select 1 from public.coach_cover c
                  where c.covering_coach = u.id and current_date between c.starts_on and c.ends_on
                    and (c.client_id = caller or c.for_coach = (select trainer_id from public.users where id = caller)));
  end if;
  return found_thread;
end;
$$;
