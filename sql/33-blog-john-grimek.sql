-- ============================================================
-- BLOG POST: "The John Grimek Breathing Squat: One Exercise, Total Bulk" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'The John Grimek Breathing Squat: One Exercise, Total Bulk',
  'john-grimek-breathing-squat',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','bodybuilding','squats','finisher'],
  'Two-time Mr. America John Grimek didn''t build his frame with a routine — he built it with one superset, done until he could barely breathe.',
  E'## The exercise that started with a magazine letter\n\nIn the early 1930s, a lifter named Joseph Hise wrote to Strongman magazine describing how adding deep knee bends (squats) to his routine helped him gain 29 pounds in a single month. That letter kicked off widespread interest in high-rep squatting for mass — and John Grimek, a training partner of Hise''s who went on to become a two-time Mr. America, Mr. Universe, and 1936 Olympic weightlifter for the USA, built much of his "Monarch of Muscledom" physique around the idea.\n\n### The breathing squat pyramid\n\nRather than a full weekly split, this is really one technique run as a single finisher: a pyramid of squats, starting at 20-25 reps and dropping in reps as the weight climbs each set (20-25 → 12-15 → 10-12 → 8-10 → 5-6 → 3-5 → 1-3), with every single squat immediately supersetted with a chest exercise (Grimek favored dumbbell pullovers or lying lateral raises) done for 8-10 reps.\n\nThe "breathing" part is deliberate: between reps of the squat itself, Grimek took three deep breaths, sucking air in until he felt pressure build in his chest, then squatted again with lungs full. The theory — shared by several pre-steroid-era bodybuilders — was that this expanded the ribcage and helped drive upper-body mass, with the immediate chest superset reinforcing the same effect while still out of breath.\n\n### How to use this\n\nThis is a finisher technique, not a full training day, so it isn''t offered as a standalone Program Builder preset. It fits well added onto the end of an existing Legs day in any of the other Old School presets — just don''t stack it on top of an already-high-volume leg session like Tom Platz''s or German Volume Training''s.\n\n---\n\n**Source:** ["The John Grimek Squat & Bulk Routine"](https://gymtalk.com/john-grimek-squat-bulk-routine/), GymTalk. This post summarizes and adapts that article''s training notes — see the original for the full write-up.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'john-grimek-breathing-squat';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
