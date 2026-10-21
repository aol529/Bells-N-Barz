-- ============================================================
-- GALLERY PICTURES
-- Run after gallery.sql. Safe to re-run.
--
-- A public 'gallery-images' bucket for the Gallery's Add Image >
-- Upload option (the blog banner picks its slides from the gallery).
-- The page has always uploaded here, but the bucket was never made,
-- so uploads failed with "Bucket not found". Everyone can see the
-- pictures; only staff can upload, replace or delete them. Same shape
-- as 'blog-images' in 79-blog-images.sql, with a 10 MB limit for
-- phone photos.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-images', 'gallery-images', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "gallery images: anyone reads" on storage.objects;
create policy "gallery images: anyone reads" on storage.objects for select
  using (bucket_id = 'gallery-images');

drop policy if exists "gallery images: staff upload" on storage.objects;
create policy "gallery images: staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery-images' and is_staff());

drop policy if exists "gallery images: staff update" on storage.objects;
create policy "gallery images: staff update" on storage.objects for update to authenticated
  using (bucket_id = 'gallery-images' and is_staff());

drop policy if exists "gallery images: staff delete" on storage.objects;
create policy "gallery images: staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'gallery-images' and is_staff());
