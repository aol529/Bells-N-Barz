-- ============================================================
-- FORGOT PASSWORD (behind the 'forgot-password' switch)
-- Run after 75-feature-switches.sql. Safe to re-run.
--
-- Log In > "Forgot your password?" first checks the email belongs to an
-- account (password_help_lookup), then offers: an emailed reset link, an
-- emailed one-time code (both Supabase Auth, no SQL needed), or asking
-- the admins (request_password_help -> a notification for every admin).
-- Admins answer that with Admin > Users > Set temporary password
-- (admin_set_temp_password); the member is made to pick a new password
-- the next time they log in (users.temp_password, cleared by
-- clear_temp_password once they have).
--
-- The switch starts OFF. Off: lookup and admin requests are refused.
-- The admin-only temporary password and the staff "Send Password Reset
-- Email" button work either way.
--
-- The lookup tells anyone whether an email has an account. To slow down
-- anyone trying lots of emails, each caller (by IP) gets 10 lookups per
-- 10 minutes; admin requests are capped at one per email per hour.
-- ============================================================

insert into public.feature_switches (key, enabled) values ('forgot-password', false)
on conflict (key) do nothing;

alter table public.users add column if not exists temp_password boolean not null default false;

create table if not exists public.password_help_log (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,          -- 'lookup' | 'admin-request'
  email      text not null,
  ip         text,
  created_at timestamptz not null default now()
);
create index if not exists idx_password_help_log_recent on public.password_help_log (kind, created_at);
alter table public.password_help_log enable row level security;
-- No policies: only the security definer functions below touch it.

-- Caller's IP as PostgREST passes it (first x-forwarded-for hop).
create or replace function bnb_request_ip()
returns text
language sql
stable
as $$
  select nullif(split_part(coalesce(
    current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1), '');
$$;

-- 'active' | 'archived' | 'none'. Archived accounts can't sign in, so the
-- app tells them to contact the gym instead of offering reset options.
create or replace function password_help_lookup(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text := bnb_request_ip();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_archived timestamptz;
begin
  if not feature_on('forgot-password') then
    raise exception 'Password help is switched off. Ask at the front desk.';
  end if;
  if v_email = '' then
    raise exception 'Enter your email.';
  end if;
  if (select count(*) from public.password_help_log
      where kind = 'lookup' and ip is not distinct from v_ip
      and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'Too many tries. Wait a few minutes and try again.';
  end if;

  insert into public.password_help_log (kind, email, ip) values ('lookup', v_email, v_ip);
  delete from public.password_help_log where created_at < now() - interval '30 days';

  select archived_at into v_archived from public.users
  where lower(email) = v_email and auth_id is not null
  order by archived_at nulls first limit 1;
  if not found then return 'none'; end if;
  return case when v_archived is null then 'active' else 'archived' end;
end;
$$;

create or replace function request_password_help(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_user public.users%rowtype;
begin
  if not feature_on('forgot-password') then
    raise exception 'Password help is switched off. Ask at the front desk.';
  end if;

  select * into v_user from public.users
  where lower(email) = v_email and auth_id is not null and archived_at is null
  limit 1;
  if not found then
    raise exception 'No account uses that email.';
  end if;

  -- Already asked within the hour: the admins have it, don't repeat.
  if exists (select 1 from public.password_help_log
             where kind = 'admin-request' and email = v_email
             and created_at > now() - interval '1 hour') then
    return;
  end if;
  insert into public.password_help_log (kind, email, ip) values ('admin-request', v_email, bnb_request_ip());

  insert into public.notifications (user_id, type, message, link_tab)
  select a.id, 'password_help',
         coalesce(nullif(v_user.full_name, ''), v_email) || ' (' || v_email || ') can''t get into their account '
         || 'and asked an admin for help. Open them in Admin > Users and use Set temporary password.',
         'users'
  from public.users a
  where a.roles && array['admin']::text[] and a.archived_at is null;
end;
$$;

-- Sets the member's password directly and makes them change it at their
-- next log-in. Admins only.
create or replace function admin_set_temp_password(p_user_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_auth uuid;
begin
  if not is_admin() then
    raise exception 'Only admins can set passwords.';
  end if;
  if length(coalesce(p_password, '')) < 6 then
    raise exception 'Password must be at least 6 characters.';
  end if;

  select auth_id into v_auth from public.users where id = p_user_id;
  if v_auth is null then
    raise exception 'That member has no login yet.';
  end if;

  update auth.users
     set encrypted_password = crypt(p_password, gen_salt('bf')),
         updated_at = now()
   where id = v_auth;

  update public.users set temp_password = true where id = p_user_id;
end;
$$;

-- Called by the member after choosing their own new password.
create or replace function clear_temp_password()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set temp_password = false where auth_id = auth.uid();
end;
$$;

revoke all on function password_help_lookup(text), request_password_help(text) from public;
grant execute on function password_help_lookup(text), request_password_help(text) to anon, authenticated;
revoke all on function admin_set_temp_password(uuid, text), clear_temp_password() from public;
grant execute on function admin_set_temp_password(uuid, text), clear_temp_password() to authenticated;
