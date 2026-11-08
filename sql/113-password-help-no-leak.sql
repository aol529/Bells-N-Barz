-- ============================================================
-- FORGOT PASSWORD: STOP SAYING WHICH EMAILS HAVE ACCOUNTS
-- Run after 76-forgot-password.sql. Safe to re-run.
--
-- The lookup used to answer 'none' / 'archived' / 'active', so anyone
-- could test emails to see who's a member. Now it answers 'ok' whatever
-- the email (still counting tries per IP, so it can't be hammered), and
-- asking the admins for help quietly does nothing for an email with no
-- account. The page says "if that email has an account…" either way.
-- ============================================================

create or replace function password_help_lookup(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text := bnb_request_ip();
  v_email text := lower(trim(coalesce(p_email, '')));
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
  return 'ok';
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
  -- No such account: say nothing different, just don't bother the admins.
  if not found then return; end if;

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
