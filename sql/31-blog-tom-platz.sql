-- ============================================================
-- BLOG POST: "The Tom Platz Leg Workout: How Much Volume Is Too Much?" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'The Tom Platz Leg Workout: How Much Volume Is Too Much?',
  'tom-platz-leg-workout',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','bodybuilding','legs','high-volume'],
  'Widely regarded as having the best leg development bodybuilding has ever seen, Tom Platz got there with a squat session most lifters would never survive.',
  E'## The legs that started arguments\n\nTom Platz never won Mr. Olympia — his best finish was 3rd in 1981 — but in a poll of Flex magazine readers, he was voted as having the best quad and hamstring development of all time. His legs were built almost entirely on one idea taken to its extreme: squat, a lot, at high reps, to genuine failure.\n\n### The session\n\nA single leg day, but a huge one — roughly 33 to 47 total working sets:\n\n- **Back Squats** — 8-12 sets of 5-20 reps\n- **Hack Squats** — 5 sets of 10-15 reps\n- **Leg Extension** — 5-8 sets of 10-15 reps\n- **Leg Curls** — 6-10 sets of 10-15 reps\n- **Standing, Seated, and Hack Machine Calf Raises** — 3-4 sets each of 10-15 reps\n\nPlatz reportedly squatted for 10 minutes straight on occasion, racking up over 100 reps with 225 pounds in a single continuous set, and famously squatted 495 pounds for 23 reps on camera. Every set was pushed to true failure — by his own account, if he didn''t end a set on the floor, he hadn''t gone hard enough.\n\n### Not a starting point\n\nThis is explicitly an advanced session — roughly 33-47 total sets for one muscle group is an enormous volume by any standard, and the source article itself suggests cutting it in half to make it achievable for most lifters. Strict below-parallel form on every rep matters even more at this volume, since fatigue is exactly when form breaks down.\n\n### How to use this\n\nThis isn''t offered as a standalone Program Builder preset, since a single leg-only day would wipe out the rest of a client''s week if loaded the normal way. If you want to use it, swap it in by hand as the Legs day inside any of the other Old School presets — Kazmaier''s, Coleman''s, or the original Old School 70''s Split are all good hosts for it.\n\n---\n\n**Source:** ["The Tom Platz Leg Workout"](https://gymtalk.com/tom-platz-leg-workout/), GymTalk. This post summarizes and adapts that article''s training notes — see the original for the full write-up.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'tom-platz-leg-workout';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
