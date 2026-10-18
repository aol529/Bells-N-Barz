-- ============================================================
-- BLOG PICTURES
-- Run after 78-library-arnold.sql. Safe to re-run.
--
-- A public 'blog-images' bucket for the blog editor's Upload (cover)
-- and Picture (inside the post) buttons. Everyone can see the pictures;
-- only staff can upload, replace or delete them. Same shape as the
-- 'library-covers' bucket in 77-library.sql.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "blog images: anyone reads" on storage.objects;
create policy "blog images: anyone reads" on storage.objects for select
  using (bucket_id = 'blog-images');

drop policy if exists "blog images: staff upload" on storage.objects;
create policy "blog images: staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-images' and is_staff());

drop policy if exists "blog images: staff update" on storage.objects;
create policy "blog images: staff update" on storage.objects for update to authenticated
  using (bucket_id = 'blog-images' and is_staff());

drop policy if exists "blog images: staff delete" on storage.objects;
create policy "blog images: staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'blog-images' and is_staff());
