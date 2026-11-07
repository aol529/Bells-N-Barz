-- ============================================================
-- APP BACKGROUNDS
-- Run after 41-coach-ratings.sql (is_admin). Safe to re-run: the
-- placeholder pictures only go in when a slot has none, so an admin's
-- replacements are never overwritten.
--
-- app_backdrops   the pictures behind the app and the website. Each has
--                 a slot:
--                   home       behind Home (the first active one is used)
--                   signin     behind the sign-in screen
--                   wallpaper  a background members can pick (step 2)
--                 a tall picture (phones) and a wide one (the website),
--                 and for an earned wallpaper the sessions it takes to
--                 unlock (null = free). Everyone reads the active ones,
--                 signed in or not (the sign-in screen needs its picture
--                 before anyone signs in). Only admins change them.
-- backdrops       public bucket for the admins' replacement photos.
--
-- The placeholders are drawn art in the site's img/backdrops/ folder,
-- to be replaced with photos of the gym from the Backgrounds admin page.
-- ============================================================

create table if not exists public.app_backdrops (
  id uuid primary key default gen_random_uuid(),
  slot text not null check (slot in ('home', 'signin', 'wallpaper')),
  name text not null check (char_length(trim(name)) between 1 and 60),
  tall_url text not null check (tall_url ~* '^https://'),
  wide_url text check (wide_url is null or wide_url ~* '^https://'),
  unlock_sessions int check (unlock_sessions is null or unlock_sessions between 1 and 10000),
  sort int not null default 0,
  active boolean not null default true,
  placeholder boolean not null default false,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists app_backdrops_slot on public.app_backdrops (slot, sort);

alter table public.app_backdrops enable row level security;

-- Signed out: the active ones only. Signed in: admins also see the hidden ones.
drop policy if exists "anyone reads active backdrops" on public.app_backdrops;
create policy "anyone reads active backdrops"
  on public.app_backdrops for select
  to anon
  using (active);

drop policy if exists "signed in read backdrops" on public.app_backdrops;
create policy "signed in read backdrops"
  on public.app_backdrops for select
  to authenticated
  using (active or is_admin());

drop policy if exists "admins manage backdrops" on public.app_backdrops;
create policy "admins manage backdrops"
  on public.app_backdrops for all
  to authenticated
  using (is_admin())
  with check (is_admin());

revoke all on public.app_backdrops from anon;
grant select on public.app_backdrops to anon;
grant select, insert, update, delete on public.app_backdrops to authenticated;

-- Who changed it last, and when, set by the database.
create or replace function app_backdrops_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := my_user_id();
  return new;
end;
$$;

drop trigger if exists app_backdrops_stamp on public.app_backdrops;
create trigger app_backdrops_stamp before insert or update on public.app_backdrops
  for each row execute function app_backdrops_stamp();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('backdrops', 'backdrops', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "backdrops: anyone reads" on storage.objects;
create policy "backdrops: anyone reads" on storage.objects for select
  using (bucket_id = 'backdrops');

drop policy if exists "backdrops: admins upload" on storage.objects;
create policy "backdrops: admins upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'backdrops' and is_admin());

drop policy if exists "backdrops: admins update" on storage.objects;
create policy "backdrops: admins update" on storage.objects for update to authenticated
  using (bucket_id = 'backdrops' and is_admin());

drop policy if exists "backdrops: admins delete" on storage.objects;
create policy "backdrops: admins delete" on storage.objects for delete to authenticated
  using (bucket_id = 'backdrops' and is_admin());

-- Placeholders: one for Home, one for sign-in, and all eight as wallpapers.
-- Each slot is filled only if it has nothing in it yet.
do $$
declare
  base constant text := 'https://aol529.github.io/Bells-N-Barz/img/backdrops/';
  art constant text[][] := array[
    ['barbell', 'Loaded bar'], ['kettlebell', 'Kettlebell'], ['plates', 'Plate stack'], ['knurl', 'Knurl'],
    ['rack', 'The rack'], ['chalk', 'Chalk dust'], ['wordmark', 'Bells n Barz'], ['moon', 'Moon over the bar']];
  i int;
begin
  if not exists (select 1 from public.app_backdrops where slot = 'home') then
    insert into public.app_backdrops (slot, name, tall_url, wide_url, placeholder)
    values ('home', 'Loaded bar', base || 'barbell-tall.jpg', base || 'barbell-wide.jpg', true);
  end if;
  if not exists (select 1 from public.app_backdrops where slot = 'signin') then
    insert into public.app_backdrops (slot, name, tall_url, wide_url, placeholder)
    values ('signin', 'Kettlebell', base || 'kettlebell-tall.jpg', base || 'kettlebell-wide.jpg', true);
  end if;
  if not exists (select 1 from public.app_backdrops where slot = 'wallpaper') then
    for i in 1 .. array_length(art, 1) loop
      insert into public.app_backdrops (slot, name, tall_url, wide_url, sort, placeholder)
      values ('wallpaper', art[i][2], base || art[i][1] || '-tall.jpg', base || art[i][1] || '-wide.jpg', i, true);
    end loop;
  end if;
end;
$$;
