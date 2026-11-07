-- ============================================================
-- MEMBERS' OWN WALLPAPERS
-- Run after 108-member-wallpaper.sql. Safe to re-run.
--
-- A member can put their own photos up as wallpapers, next to the gym's
-- (Wallpaper page, app and website). They're private: kept in the
-- member-wallpapers bucket under the member's own folder, and nobody
-- else, staff included, can see them, like progress photos.
--
-- member_wallpapers   name and file path of each one, up to 12 a member.
-- member_prefs        own_wallpaper_id: the one of their own they're
--                     showing. The app sets either this or wallpaper_id
--                     (a gym wallpaper), never both; null + null = the
--                     gym's Home picture.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-wallpapers', 'member-wallpapers', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "member wallpapers: owner reads" on storage.objects;
create policy "member wallpapers: owner reads" on storage.objects for select to authenticated
  using (bucket_id = 'member-wallpapers' and (storage.foldername(name))[1] = my_user_id()::text);

drop policy if exists "member wallpapers: owner uploads" on storage.objects;
create policy "member wallpapers: owner uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'member-wallpapers' and (storage.foldername(name))[1] = my_user_id()::text);

drop policy if exists "member wallpapers: owner deletes" on storage.objects;
create policy "member wallpapers: owner deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'member-wallpapers' and (storage.foldername(name))[1] = my_user_id()::text);

create table if not exists public.member_wallpapers (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null default my_user_id() references public.users(id) on delete cascade,
  name       text not null check (char_length(trim(name)) between 1 and 60),
  path       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists member_wallpapers_member on public.member_wallpapers (member_id, created_at);

alter table public.member_wallpapers enable row level security;
drop policy if exists "members manage own wallpapers" on public.member_wallpapers;
create policy "members manage own wallpapers" on public.member_wallpapers for all
  to authenticated
  using (member_id = my_user_id())
  with check (member_id = my_user_id() and split_part(path, '/', 1) = my_user_id()::text);

revoke all on public.member_wallpapers from anon;
grant select, insert, update, delete on public.member_wallpapers to authenticated;

-- Twelve each is plenty, and keeps the bucket from becoming a photo album.
create or replace function member_wallpapers_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' and (select count(*) from member_wallpapers w where w.member_id = new.member_id) >= 12 then
    raise exception 'You can keep 12 of your own wallpapers. Delete one to add another.';
  end if;
  return new;
end;
$$;

drop trigger if exists member_wallpapers_limit on public.member_wallpapers;
create trigger member_wallpapers_limit before insert or update on public.member_wallpapers
  for each row execute function member_wallpapers_limit();

alter table public.member_prefs
  add column if not exists own_wallpaper_id uuid references public.member_wallpapers(id) on delete set null;

-- 108's check, now also making sure an own wallpaper is the member's own.
create or replace function member_prefs_wallpaper_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  need integer;
begin
  if new.own_wallpaper_id is not null
     and (tg_op = 'INSERT' or new.own_wallpaper_id is distinct from old.own_wallpaper_id)
     and not exists (select 1 from member_wallpapers w where w.id = new.own_wallpaper_id and w.member_id = new.member_id) then
    raise exception 'That wallpaper isn''t yours.';
  end if;
  if new.wallpaper_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.wallpaper_id is not distinct from old.wallpaper_id then return new; end if;
  select b.unlock_sessions into need
  from app_backdrops b
  where b.id = new.wallpaper_id and b.slot = 'wallpaper' and b.active;
  if not found then raise exception 'That wallpaper isn''t available.'; end if;
  if need is not null and
     (select count(distinct h.date_iso) from mls_history h where h.member_id = new.member_id) < need then
    raise exception 'Train % sessions to unlock that wallpaper.', need;
  end if;
  return new;
end;
$$;
