-- ============================================================
-- BLOG POST: "Bill Kazmaier's Power-Building Split: Strength Training From a Strongman" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Bill Kazmaier''s Power-Building Split: Strength Training From a Strongman',
  'bill-kazmaier-power-building-split',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','strength','powerbuilding','program-design'],
  'A three-time World''s Strongest Man winner didn''t train like a bodybuilder or a pure powerlifter — he split the difference, on purpose.',
  E'## Not quite a bodybuilder, not quite a powerlifter\n\nBill Kazmaier won World''s Strongest Man three times and held plenty of lifting titles along the way, but his training didn''t look like either a typical bodybuilding split or a typical powerlifting peaking cycle. It landed in between — often called "power-building" today.\n\n### The heavy/light structure\n\nKazmaier trained four days a week (Monday, Tuesday, Thursday, Saturday), and the trick was alternating which lift got the heavy treatment on which day:\n\n- **Monday** — Chest heavy, then shoulders and triceps\n- **Tuesday** — Squats heavy, deadlifts light, then back and biceps\n- **Thursday** — Chest light, shoulders heavy, triceps\n- **Saturday** — Deadlifts heavy, squats light, then back and arms\n\nEach major lift got trained twice a week, but never hard twice in the same week — one heavy session, one light session focused on form and a slower rep speed. That''s a meaningfully different recovery strategy than either straight bodybuilding (same intensity every session) or straight powerlifting (long, slow builds toward a single peak).\n\n### Mostly moderate reps, not singles\n\nDespite the strongman background, most of the actual work here sits in the 8-10 rep range rather than 1-3 rep max attempts — accessory volume for shoulders, arms, and legs on top of the heavy/light compound work. Kazmaier ran this on a roughly 10-week cycle building toward a competition, gradually working back up toward (and slightly past) his previous best in the final weeks.\n\n### Try it yourself\n\nThis split is a loadable preset in **Coach > Program Builder** — look for "Bill Kazmaier''s Power-Building Split" under Preset Programs.\n\n---\n\n**Source:** Evette Hinzman, ["Classic Strength Training with Bill Kazmaier"](https://www.getholistichealth.com/13332/classic-strength-training-with-bill-kazmaier/), Get Holistic Health. This post summarizes and adapts that article''s training notes — see the original for the full write-up.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'bill-kazmaier-power-building-split';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
