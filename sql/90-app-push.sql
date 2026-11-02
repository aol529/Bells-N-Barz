-- ============================================================
-- ANDROID APP PUSH (Firebase Cloud Messaging)
-- Run after 86-push-notifications.sql. Safe to re-run.
--
-- The Android app (github.com/aol529/bells-n-barz-android) registers its
-- FCM token here after sign-in. The same notify_push() trigger from sql/86
-- already posts every new `notifications` row to the send-push Edge
-- Function; that function now also sends it to these tokens (see
-- supabase/functions/send-push/README.md, "Android app").
-- ============================================================

create table if not exists public.app_push_tokens (
  token       text primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  platform    text not null default 'android' check (platform in ('android')),
  created_at  timestamptz not null default now(),
  last_used   timestamptz
);
create index if not exists app_push_tokens_user_idx on public.app_push_tokens (user_id);

alter table public.app_push_tokens enable row level security;
drop policy if exists "users manage own app push tokens" on public.app_push_tokens;
create policy "users manage own app push tokens" on public.app_push_tokens for all
  using (user_id = my_user_id())
  with check (user_id = my_user_id());
revoke all on public.app_push_tokens from anon;
grant select, insert, update, delete on public.app_push_tokens to authenticated;

-- A phone that was signed in as someone else hands its token over to
-- whoever is signed in now (RLS alone would block it: the old row is theirs).
create or replace function save_app_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := my_user_id();
begin
  if v_me is null then raise exception 'Sign in first.'; end if;
  if p_token is null or char_length(p_token) not between 20 and 4096 then raise exception 'Bad token.'; end if;
  insert into app_push_tokens (token, user_id) values (p_token, v_me)
  on conflict (token) do update set user_id = v_me, created_at = now();
end;
$$;
revoke all on function save_app_push_token(text) from public, anon;
grant execute on function save_app_push_token(text) to authenticated;

-- Verify (as a signed-in member in the app, then here):
--   select user_id, left(token, 12), created_at from app_push_tokens;
