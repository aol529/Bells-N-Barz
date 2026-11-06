-- ============================================================
-- COACHES: LAST TWO GAPS
-- Run after 102-coach-private-data.sql. Safe to re-run.
--
-- 1. Coaches no longer read fellow staff's full records. Coach names
--    still come from available_coaches(), and the front office is unchanged.
-- 2. A coach can only start a coaching-team message with someone they
--    can see: a client, a 1-on-1, or someone they're covering.
--
-- To undo: re-run can_see_member from sql/100 and send_message from sql/60.
-- ============================================================

create or replace function can_see_member(p_member uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_member = my_user_id() or is_front_office() or (is_staff() and (
    exists (select 1 from public.users u where u.id = p_member and u.trainer_id = my_user_id())
    or exists (select 1 from public.pt_bookings b where b.user_id = p_member and b.trainer_id = my_user_id())
    or exists (select 1 from public.coach_cover c left join public.users u on u.id = p_member
               where c.covering_coach = my_user_id() and current_date between c.starts_on and c.ends_on
                 and (c.client_id = p_member or c.for_coach = u.trainer_id))
  ));
$$;

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
    from public.users
    where roles && array['admin','trainer','staff']::text[];
  end if;
  return found_thread;
end;
$$;
