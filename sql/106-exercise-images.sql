-- ============================================================
-- EXERCISE GUIDE PICTURES (ran on live 2026-11-07: 47 of 51 guides got photos, bucket made)
-- Run after 105-exercise-guides.sql. Safe to re-run: starter pictures
-- only go on guides that have none, so a coach's photos are kept.
--
-- exercise_guides.images  up to 4 https picture links, in order (the
--                  starter ones are the start and finish of the move).
-- exercise-images  public bucket for coaches' own photos (admins and
--                  trainers upload, replace and delete; everyone sees).
--
-- The starter photos are from free-exercise-db (github.com/yuhonas/
-- free-exercise-db, public domain under the Unlicense), copied into
-- the site's img/exercises/ folder so they load from our own address.
-- ============================================================

alter table public.exercise_guides add column if not exists images text[] not null default '{}';

alter table public.exercise_guides drop constraint if exists exercise_guides_images_check;
alter table public.exercise_guides add constraint exercise_guides_images_check check (
  cardinality(images) <= 4
  and (cardinality(images) = 0 or array_to_string(images, E'\n') ~ '^https://[^\s]+(\nhttps://[^\s]+)*$')
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-images', 'exercise-images', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "exercise images: anyone reads" on storage.objects;
create policy "exercise images: anyone reads" on storage.objects for select
  using (bucket_id = 'exercise-images');

drop policy if exists "exercise images: coaches upload" on storage.objects;
create policy "exercise images: coaches upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'exercise-images' and (is_admin() or exists (select 1 from public.users where auth_id = auth.uid() and 'trainer' = any(roles))));

drop policy if exists "exercise images: coaches update" on storage.objects;
create policy "exercise images: coaches update" on storage.objects for update to authenticated
  using (bucket_id = 'exercise-images' and (is_admin() or exists (select 1 from public.users where auth_id = auth.uid() and 'trainer' = any(roles))));

drop policy if exists "exercise images: coaches delete" on storage.objects;
create policy "exercise images: coaches delete" on storage.objects for delete to authenticated
  using (bucket_id = 'exercise-images' and (is_admin() or exists (select 1 from public.users where auth_id = auth.uid() and 'trainer' = any(roles))));

-- Starter pictures, only where a guide has none yet. The stamp trigger
-- would name whoever runs this as the editor; that's fine for a one-off.
update public.exercise_guides g
set images = v.images
from (values
  ('Incline Barbell Bench Press', array['https://aol529.github.io/Bells-N-Barz/img/exercises/barbell-incline-bench-press-medium-grip-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/barbell-incline-bench-press-medium-grip-2.jpg']),
  ('Chest Supported Dumbbell Row', array['https://aol529.github.io/Bells-N-Barz/img/exercises/dumbbell-incline-row-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/dumbbell-incline-row-2.jpg']),
  ('Decline Dumbbell Bench Press', array['https://aol529.github.io/Bells-N-Barz/img/exercises/decline-dumbbell-bench-press-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/decline-dumbbell-bench-press-2.jpg']),
  ('T-Bar Row', array['https://aol529.github.io/Bells-N-Barz/img/exercises/t-bar-row-with-handle-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/t-bar-row-with-handle-2.jpg']),
  ('Flat Dumbbell Bench Press', array['https://aol529.github.io/Bells-N-Barz/img/exercises/dumbbell-bench-press-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/dumbbell-bench-press-2.jpg']),
  ('Barbell Row', array['https://aol529.github.io/Bells-N-Barz/img/exercises/bent-over-barbell-row-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/bent-over-barbell-row-2.jpg']),
  ('Cable Flyes', array['https://aol529.github.io/Bells-N-Barz/img/exercises/flat-bench-cable-flyes-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/flat-bench-cable-flyes-2.jpg']),
  ('Single-Arm Dumbbell Row', array['https://aol529.github.io/Bells-N-Barz/img/exercises/one-arm-dumbbell-row-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/one-arm-dumbbell-row-2.jpg']),
  ('Heel Elevated Goblet Squats', array['https://aol529.github.io/Bells-N-Barz/img/exercises/goblet-squat-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/goblet-squat-2.jpg']),
  ('Sumo Squats', array['https://aol529.github.io/Bells-N-Barz/img/exercises/plie-dumbbell-squat-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/plie-dumbbell-squat-2.jpg']),
  ('Landmine Static Split Squats', array['https://aol529.github.io/Bells-N-Barz/img/exercises/split-squats-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/split-squats-2.jpg']),
  ('Leg Extensions', array['https://aol529.github.io/Bells-N-Barz/img/exercises/leg-extensions-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/leg-extensions-2.jpg']),
  ('Pendulum Leg Press', array['https://aol529.github.io/Bells-N-Barz/img/exercises/leg-press-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/leg-press-2.jpg']),
  ('Standing Cable Hip Flexion', array['https://aol529.github.io/Bells-N-Barz/img/exercises/hip-flexion-with-band-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/hip-flexion-with-band-2.jpg']),
  ('Lying Leg Curls', array['https://aol529.github.io/Bells-N-Barz/img/exercises/lying-leg-curls-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/lying-leg-curls-2.jpg']),
  ('Standing Calf Raises', array['https://aol529.github.io/Bells-N-Barz/img/exercises/standing-calf-raises-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/standing-calf-raises-2.jpg']),
  ('Military Press', array['https://aol529.github.io/Bells-N-Barz/img/exercises/standing-military-press-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/standing-military-press-2.jpg']),
  ('Curls', array['https://aol529.github.io/Bells-N-Barz/img/exercises/barbell-curl-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/barbell-curl-2.jpg']),
  ('Shrugs', array['https://aol529.github.io/Bells-N-Barz/img/exercises/barbell-shrug-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/barbell-shrug-2.jpg']),
  ('Lateral Flyes', array['https://aol529.github.io/Bells-N-Barz/img/exercises/side-lateral-raise-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/side-lateral-raise-2.jpg']),
  ('Front Raises', array['https://aol529.github.io/Bells-N-Barz/img/exercises/front-dumbbell-raise-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/front-dumbbell-raise-2.jpg']),
  ('Weighted Pull-ups', array['https://aol529.github.io/Bells-N-Barz/img/exercises/weighted-pull-ups-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/weighted-pull-ups-2.jpg']),
  ('Lateral Raises', array['https://aol529.github.io/Bells-N-Barz/img/exercises/side-lateral-raise-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/side-lateral-raise-2.jpg']),
  ('Wide Cable Lat Pulldowns', array['https://aol529.github.io/Bells-N-Barz/img/exercises/wide-grip-lat-pulldown-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/wide-grip-lat-pulldown-2.jpg']),
  ('Rear Delt Flyes', array['https://aol529.github.io/Bells-N-Barz/img/exercises/reverse-flyes-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/reverse-flyes-2.jpg']),
  ('Pullovers', array['https://aol529.github.io/Bells-N-Barz/img/exercises/bent-arm-dumbbell-pullover-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/bent-arm-dumbbell-pullover-2.jpg']),
  ('Face Pulls', array['https://aol529.github.io/Bells-N-Barz/img/exercises/face-pull-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/face-pull-2.jpg']),
  ('Romanian Deadlifts', array['https://aol529.github.io/Bells-N-Barz/img/exercises/romanian-deadlift-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/romanian-deadlift-2.jpg']),
  ('Reverse Lunges', array['https://aol529.github.io/Bells-N-Barz/img/exercises/dumbbell-rear-lunge-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/dumbbell-rear-lunge-2.jpg']),
  ('Hip Thrusts', array['https://aol529.github.io/Bells-N-Barz/img/exercises/barbell-hip-thrust-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/barbell-hip-thrust-2.jpg']),
  ('Leg Curls', array['https://aol529.github.io/Bells-N-Barz/img/exercises/seated-leg-curl-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/seated-leg-curl-2.jpg']),
  ('Step Ups', array['https://aol529.github.io/Bells-N-Barz/img/exercises/dumbbell-step-ups-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/dumbbell-step-ups-2.jpg']),
  ('Hip Abductions', array['https://aol529.github.io/Bells-N-Barz/img/exercises/thigh-abductor-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/thigh-abductor-2.jpg']),
  ('Seated Dumbbell Hip Adduction', array['https://aol529.github.io/Bells-N-Barz/img/exercises/thigh-adductor-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/thigh-adductor-2.jpg']),
  ('Nordic Curls', array['https://aol529.github.io/Bells-N-Barz/img/exercises/natural-glute-ham-raise-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/natural-glute-ham-raise-2.jpg']),
  ('Seated Calf Raises', array['https://aol529.github.io/Bells-N-Barz/img/exercises/seated-calf-raise-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/seated-calf-raise-2.jpg']),
  ('Back Extensions', array['https://aol529.github.io/Bells-N-Barz/img/exercises/hyperextensions-back-extensions-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/hyperextensions-back-extensions-2.jpg']),
  ('Push-ups', array['https://aol529.github.io/Bells-N-Barz/img/exercises/pushups-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/pushups-2.jpg']),
  ('Dips', array['https://aol529.github.io/Bells-N-Barz/img/exercises/dips-chest-version-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/dips-chest-version-2.jpg']),
  ('Overhead Tricep Extensions', array['https://aol529.github.io/Bells-N-Barz/img/exercises/cable-rope-overhead-triceps-extension-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/cable-rope-overhead-triceps-extension-2.jpg']),
  ('Spider Curls', array['https://aol529.github.io/Bells-N-Barz/img/exercises/spider-curl-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/spider-curl-2.jpg']),
  ('Cable Tricep Kickbacks', array['https://aol529.github.io/Bells-N-Barz/img/exercises/tricep-dumbbell-kickback-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/tricep-dumbbell-kickback-2.jpg']),
  ('Incline Bench Curls', array['https://aol529.github.io/Bells-N-Barz/img/exercises/incline-dumbbell-curl-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/incline-dumbbell-curl-2.jpg']),
  ('Cable Crunches', array['https://aol529.github.io/Bells-N-Barz/img/exercises/cable-crunch-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/cable-crunch-2.jpg']),
  ('Cable Side Bends', array['https://aol529.github.io/Bells-N-Barz/img/exercises/one-arm-high-pulley-cable-side-bends-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/one-arm-high-pulley-cable-side-bends-2.jpg']),
  ('Zercher Squats', array['https://aol529.github.io/Bells-N-Barz/img/exercises/zercher-squats-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/zercher-squats-2.jpg']),
  ('Deep Squat Hold', array['https://aol529.github.io/Bells-N-Barz/img/exercises/bodyweight-squat-1.jpg', 'https://aol529.github.io/Bells-N-Barz/img/exercises/bodyweight-squat-2.jpg'])
) as v(name, images)
where lower(trim(g.name)) = lower(trim(v.name)) and cardinality(g.images) = 0;
