-- ============================================================
-- PUSH NOTIFICATIONS (phone alerts with the app closed)
-- Run after 09-notifications.sql. Safe to re-run.
-- Needs the Edge Function in supabase/functions/send-push — see
-- supabase/functions/send-push/README.md for the steps.
--
-- Every row added to `notifications` (messages, bookings, reminders,
-- freezes...) is also sent as a Web Push to each device the member
-- turned alerts on for:
--   push_subscriptions  one row per device (browser push endpoint + keys),
--                       written by the member's own browser.
--   trigger             after insert on notifications, posts the row to the
--                       send-push Edge Function with pg_net, signed with a
--                       random secret kept in Vault (never in this repo).
-- The function looks up that member's devices and sends the push; devices
-- that have gone away (410/404) are deleted there.
-- ============================================================

create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text not null default '',
  created_at  timestamptz not null default now(),
  last_used   timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "users manage own push subscriptions" on public.push_subscriptions;
create policy "users manage own push subscriptions" on public.push_subscriptions for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());
revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- A device signed in as someone else before: hand the endpoint over to
-- whoever is signed in now (RLS alone would block the upsert, since the
-- existing row belongs to the other account).
create or replace function save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := my_user_id();
begin
  if v_me is null then raise exception 'Sign in first.'; end if;
  insert into push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (v_me, p_endpoint, p_p256dh, p_auth, coalesce(left(p_user_agent, 300), ''))
  on conflict (endpoint) do update
    set user_id = v_me, p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent;
end;
$$;
revoke all on function save_push_subscription(text, text, text, text) from public, anon;
grant execute on function save_push_subscription(text, text, text, text) to authenticated;

-- The shared secret between this trigger and the Edge Function. Made once,
-- here in the database; copy it into the function's secrets with:
--   select decrypted_secret from vault.decrypted_secrets where name = 'push_webhook_secret';
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'push_webhook_secret') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'push_webhook_secret', 'Signs notifications sent to the send-push Edge Function');
  end if;
end $$;

create or replace function notify_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
begin
  -- Nobody to send to: skip the HTTP call.
  if not exists (select 1 from push_subscriptions where user_id = new.user_id) then
    return new;
  end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'push_webhook_secret';
  perform net.http_post(
    url := 'https://orurnegmjqytuxbtoqkn.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', coalesce(v_secret, '')),
    body := jsonb_build_object('user_id', new.user_id, 'type', new.type, 'message', new.message, 'link_tab', new.link_tab, 'id', new.id)
  );
  return new;
exception when others then
  -- A push failing must never stop the notification itself being saved.
  raise warning 'notify_push failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists trg_notify_push on public.notifications;
create trigger trg_notify_push
  after insert on public.notifications
  for each row
  execute function notify_push();
