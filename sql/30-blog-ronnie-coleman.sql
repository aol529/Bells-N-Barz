-- ============================================================
-- BLOG POST: "Ronnie Coleman's Power-Building Split: Yeah Buddy, Light Weight" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Ronnie Coleman''s Power-Building Split: Yeah Buddy, Light Weight',
  'ronnie-coleman-power-building-split',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','bodybuilding','powerbuilding','mr-olympia'],
  '8-time Mr. Olympia Ronnie Coleman built size by treating a near-max deadlift as a warmup and everything else as a bodybuilder.',
  E'## Bodybuilder''s volume, powerlifter''s loading\n\nRonnie Coleman matched Lee Haney''s record of eight Mr. Olympia wins (1998-2005), and became just as famous for how he trained as for how he looked — footage of him talking through 800-pound deadlifts like a warmup set is still widely shared. His actual weekly structure, though, is closer to modern "power-building" than pure powerlifting: one very heavy, low-rep compound lift anchoring each session, surrounded by higher-rep bodybuilding accessory work.\n\n### The split\n\nFour training days, each body part hit once a week:\n\n- **Back & Biceps** — anchored by low-rep deadlifts\n- **Chest & Triceps** — anchored by low-rep bench press\n- **Shoulders & Traps** — moderate-rep pressing and raises\n- **Legs** — anchored by low-rep squats, plus a long list of higher-rep accessory work\n\n### It''s meant to progress, not repeat\n\nUnlike most of the other Old School presets here, this one is explicitly a multi-week template: the anchor lift''s rep count is meant to climb over successive weeks (for example, squats starting around 2 reps a set and working up toward 6-10 over a few weeks) while the accessory exercises stay roughly the same. The version loaded into this app''s Program Builder is Week 1 — treat it as a starting point to build from rather than a fixed routine to run unchanged for months.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for "Ronnie Coleman''s Power-Building Split" under Preset Programs.\n\n---\n\n**Source:** exercise.com, "Ronnie Coleman Workout Plan." This post summarizes and adapts that workout plan''s exercise selection and set/rep scheme.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'ronnie-coleman-power-building-split';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
