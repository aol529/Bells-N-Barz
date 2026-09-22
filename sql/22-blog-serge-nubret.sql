-- ============================================================
-- BLOG POST: "Serge Nubret's Pump: Golden-Era Training Without the Pyramid" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
-- Cites the source article by name and URL at the end of the body (Cast Iron Strength).
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Serge Nubret''s Pump: Golden-Era Training Without the Pyramid',
  'serge-nubret-pump-training',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','bodybuilding','high-volume','program-design'],
  'Arnold pyramided up to a heavy single. Serge Nubret did the opposite — light-ish weight, 12 reps a set, 6 to 8 sets an exercise, and almost no rest.',
  E'## The other golden-era approach\n\nMost "old school 70''s" write-ups describe one training philosophy: pyramid the weight up each set, chase a heavy single once a week, keep sets in the 5-12 range. Serge Nubret — a Mr. Universe and a fixture of that same era — trained almost the opposite way, and it''s worth understanding as its own approach rather than a variation on the first.\n\n### The split\n\nStill a three-way body-part rotation, twice through the week, Sunday off — but grouped differently:\n\n- **Monday & Thursday** — Chest & Quads\n- **Tuesday & Friday** — Back & Hamstrings\n- **Wednesday & Saturday** — Shoulders, Arms & Calves\n- **Sunday** — full rest ("stay home in bed and recover" is how the source article put it, not a euphemism)\n\n### The actual difference: pump over peak\n\nWhere the pyramid approach builds to one very heavy set, Nubret''s routine stayed at one working weight for every set of an exercise — enough to get 12 reps, no more, no less — for 6 to 8 sets in a row. Rest periods were kept short, aiming for 30 seconds and capping at a minute. There was no weekly 1-rep-max test built into the week at all.\n\nThe goal wasn''t peak force output, it was time spent with blood forced into the muscle — what''s usually called "the pump." More total sets at a moderate load, less rest between them, no attempt to max out. It''s a legitimate way to build muscle that trades absolute strength focus for sheer volume and metabolic stress.\n\n### What this means if you''re choosing between presets\n\nThis is not a drop-in replacement for the pyramid-style Old School presets — it''s a different stimulus. Sets nearly double (6-8 vs. 5) while rest is cut in half, so total session time and cardiovascular demand both go up noticeably. It suits a lifter who tolerates volume well and wants a step toward bodybuilding-style conditioning rather than a step toward raw strength.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for "Serge Nubret''s High-Volume Routine" under Preset Programs.\n\n---\n\n**Source:** ["Serge Nubret''s Old School Workout Routine"](https://www.castironstrength.com/serge-nubrets-old-school-workout-routine/), Cast Iron Strength. This post summarizes and adapts that article''s training notes — see the original for the full write-up.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'serge-nubret-pump-training';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
