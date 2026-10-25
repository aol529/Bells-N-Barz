-- ============================================================
-- PROGRESS PHOTOS
-- Run after gym.sql. Safe to re-run.
--
-- Me > Photos: a member's own front / side / back photos by date, to
-- compare side by side. Private to the member: a private bucket
-- ('progress-photos'), each member's files under a folder named with
-- their users.id, readable through short-lived signed URLs only. Staff
-- deliberately get no access, to the files or the rows.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "progress photos: owner reads" on storage.objects;
create policy "progress photos: owner reads" on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = my_user_id()::text);

drop policy if exists "progress photos: owner uploads" on storage.objects;
create policy "progress photos: owner uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = my_user_id()::text);

drop policy if exists "progress photos: owner deletes" on storage.objects;
create policy "progress photos: owner deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = my_user_id()::text);

create table if not exists public.progress_photos (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null default my_user_id() references public.users(id) on delete cascade,
  taken_on   date not null default current_date,
  pose       text not null default 'front' check (pose in ('front', 'side', 'back', 'other')),
  path       text not null,
  note       text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists progress_photos_member_idx on public.progress_photos (member_id, taken_on);

alter table public.progress_photos enable row level security;
drop policy if exists "members manage own progress photos" on public.progress_photos;
create policy "members manage own progress photos" on public.progress_photos for all
  using (member_id = my_user_id())
  with check (member_id = my_user_id() and split_part(path, '/', 1) = my_user_id()::text);

revoke all on public.progress_photos from anon;
grant select, insert, update, delete on public.progress_photos to authenticated;
