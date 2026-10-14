-- ============================================================
-- FEATURE SWITCHES (Admin > Switchboard)
-- Run after 74-registration-fee.sql. Safe to re-run.
--
-- One row per switchable feature: on or off. Everyone (signed in or not)
-- can read them, since the app hides switched-off features for every
-- visitor; only admins can flip them. A feature with no row counts as
-- ON, so adding a new switch in the app never hides anything until an
-- admin turns it off. Names and descriptions live in the app
-- (js/bells-n-barz-features.js), not here.
-- ============================================================

create table if not exists public.feature_switches (
  key        text primary key,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

alter table public.feature_switches enable row level security;

drop policy if exists "anyone reads feature switches" on public.feature_switches;
create policy "anyone reads feature switches"
  on public.feature_switches for select
  using (true);

drop policy if exists "admins manage feature switches" on public.feature_switches;
create policy "admins manage feature switches"
  on public.feature_switches for all
  using (is_admin())
  with check (is_admin());

grant select on public.feature_switches to anon, authenticated;
grant insert, update on public.feature_switches to authenticated;

-- For SQL that needs to respect a switch (missing row = on).
create or replace function feature_on(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select enabled from public.feature_switches where key = p_key), true);
$$;

insert into public.feature_switches (key, enabled) values
  ('currency-switch', true),
  ('registration-fee', true)
on conflict (key) do nothing;

-- Registration fee (74) now respects its switch.
create or replace function add_registration_invoice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_staff() or current_setting('bnb.system_write', true) = 'on'
     or not feature_on('registration-fee') then
    return new;
  end if;

  insert into public.invoices (user_id, amount, type, issued_date, due_date, notes)
  values (new.id, 0.50, 'registration', gym_local_now()::date, gym_local_now()::date + 7,
          'One-time app registration fee');
  return new;
end;
$$;
