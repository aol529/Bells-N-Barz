-- ============================================================
-- LUNAR REMINDERS: add Full Moon
-- Run after 43-lunar-reminders.sql. Adds 'full_moon' (Purnima) as a
-- third reminder kind alongside Ekadashi and New Moon — same 24-hour
-- window, same bell + Inbox delivery, same per-member dedup. Only the
-- allowed-kind lists change; send_lunar_reminders() is otherwise
-- identical to 43.
-- ============================================================

alter table public.lunar_reminders_sent drop constraint if exists lunar_reminders_sent_kind_check;
alter table public.lunar_reminders_sent add constraint lunar_reminders_sent_kind_check
  check (kind in ('ekadashi', 'new_moon', 'full_moon'));

create or replace function send_lunar_reminders(p_kind text, p_event_start timestamptz, p_message text)
returns integer  -- how many members were reminded by this call
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_staff boolean := is_staff();
  v_start timestamptz := date_trunc('minute', p_event_start);
  v_body text := btrim(coalesce(p_message, ''));
  r record;
  v_sender uuid;
  v_thread uuid;
  v_sent integer := 0;
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;
  if p_kind not in ('ekadashi', 'new_moon', 'full_moon') then
    raise exception 'Unknown reminder kind.';
  end if;
  -- 25h rather than 24h leaves room for a browser clock running a bit fast.
  if v_start <= now() or v_start > now() + interval '25 hours' then
    raise exception 'Reminders can only be sent in the 24 hours before the event.';
  end if;
  if v_body = '' or char_length(v_body) > 500 then
    raise exception 'Reminder text must be 1-500 characters.';
  end if;

  for r in
    select u.id, u.trainer_id
    from public.users u
    where u.status <> 'suspended'
    and u.roles && array['member']::text[]
    and (v_staff or u.id = caller)
  loop
    insert into public.lunar_reminders_sent (member_id, kind, event_start)
    values (r.id, p_kind, v_start)
    on conflict do nothing;
    if not found then
      continue; -- already reminded, by this session or another one
    end if;

    if r.id <> caller then
      v_sender := caller; -- staff sending to the whole roster
    else
      v_sender := coalesce(
        r.trainer_id,
        (select a.id from public.users a
         where a.roles && array['admin']::text[]
         and a.status <> 'suspended' and a.id <> r.id
         order by a.created_at limit 1)
      );
    end if;

    if v_sender is not null then
      select id into v_thread from public.dm_threads
      where user_a = least(v_sender, r.id) and user_b = greatest(v_sender, r.id);
      if v_thread is null then
        insert into public.dm_threads (user_a, user_b)
        values (least(v_sender, r.id), greatest(v_sender, r.id))
        returning id into v_thread;
      end if;
      insert into public.dm_messages (thread_id, sender_id, body) values (v_thread, v_sender, v_body);
      update public.dm_threads set updated_at = now(), last_sender_id = v_sender where id = v_thread;
      v_thread := null;
    end if;

    insert into public.notifications (user_id, type, message, link_tab)
    values (r.id, 'lunar_reminder', v_body, case when v_sender is null then null else 'inbox' end);

    v_sent := v_sent + 1;
  end loop;

  return v_sent;
end;
$$;

-- Grants from 43 carry over: CREATE OR REPLACE keeps a function's
-- existing privileges.

-- ============================================================
-- Verify (as a member, with any time 1-23h ahead):
--   select send_lunar_reminders('full_moon', now() + interval '3 hours', 'Test');
--   → 1 the first time, 0 after (already claimed).
-- ============================================================
