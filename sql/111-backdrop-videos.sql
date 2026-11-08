-- ============================================================
-- BACKGROUND VIDEOS
-- Run after 110-wallpaper-settings.sql. Safe to re-run.
--
-- A gym picture (app_backdrops) can carry a short looping clip as well
-- as its photos. Admins upload it in Admin > Backgrounds; the photo stays
-- as the still shown until the clip is ready (and instead of it on
-- battery saver, mobile data, or "reduce motion").
--
-- Video only plays for people following the gym's default (and website
-- visitors), and only on Home. A member who sets up their own wallpaper
-- gets photos: clips are big, and this keeps the downloads in the gym's
-- hands.
-- ============================================================

alter table public.app_backdrops
  add column if not exists video_url text check (video_url is null or video_url ~* '^https://');

-- The backdrops bucket takes clips too (MP4 or WebM, up to 25 MB; the
-- pages ask for much less).
update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
where id = 'backdrops';
