-- ============================================================
-- LUNAR REMINDERS (Ekadashi + New Moon)
-- Replaces the client-side Ekadashi reminder loop from
-- 15-ekadashi-reminders.sql with one server function covering both
-- Ekadashi and the new moon. Each reminder lands in two places:
--   * the notification bell, carrying the reminder text itself (the
--     old flow only produced a generic "X sent you a message"), and
--   * the Inbox, as a direct message.
--
-- Who triggers it: the event times are computed in the browser (see
-- nextEkadashi()/nextNewMoon() in js/bells-n-barz-shell.js — there's
-- no astronomy on the server), so whoever opens the app inside the
-- 24-hour window sends it:
--   * a staff session sends to every active member at once (the old
--     behaviour), and
--   * a member session sends to just that member — new here, so a
--     member no longer depends on a staff member happening to open the
--     app during that window.
-- A member's own reminder DM comes from their coach (users.trainer_id),
-- or the longest-standing admin if they have no coach — a DM needs a
-- sender, and nobody can message themselves. If there's no one to send
-- it from, they still get the bell notification.
--
-- Dedup: one claim row per (member, kind, event). The event time is
-- truncated to the minute before claiming — two browsers compute the
-- same event a fraction of a millisecond apart (the old exact-timestamp
-- key could let both through and double-send).
-- ============================================================

create table if not exists public.lunar_reminders_sent (
  member_id uuid not null references public.users(id),
  kind text not null check (kind in ('ekadashi', 'new_moon')),
  event_start timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (member_id, kind, event_start)
);

alter table public.lunar_reminders_sent enable row level security;

drop policy if exists "staff read lunar reminder log" on public.lunar_reminders_sent;
create policy "staff read lunar reminder log"
  on public.lunar_reminders_sent for select
  using (is_staff());
-- No write policies — claims only happen inside send_lunar_reminders().

-- Carry over what the old table already sent, so an Ekadashi reminded
-- under the old flow isn't sent a second time on the day this ships.
insert into public.lunar_reminders_sent (member_id, kind, event_start, sent_at)
select member_id, 'ekadashi', date_trunc('minute', ekadashi_start), sent_at
from public.ekadashi_reminders_sent
on conflict do nothing;

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
  if p_kind not in ('ekadashi', 'new_moon') then
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

revoke execute on function send_lunar_reminders(text, timestamptz, text) from public;
grant execute on function send_lunar_reminders(text, timestamptz, text) to authenticated;

-- ============================================================
-- Verify (within 24h of a real event — or temporarily pass a
-- timestamp a few hours ahead):
-- 1. As a member: select send_lunar_reminders('new_moon', now() + interval '3 hours', 'Test');
--    → 1; a bell notification with the text, and an Inbox message from
--    your coach. Running it again → 0 (already claimed).
-- 2. As staff: same call with a different time → number of active
--    members not yet reminded for that event.
-- 3. Any call with an event 2+ days out → "only ... in the 24 hours
--    before the event".
-- ============================================================
