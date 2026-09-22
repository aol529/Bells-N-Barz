-- ============================================================
-- BLOG POST: "German Volume Training: The Ten Sets Method" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'German Volume Training: The Ten Sets Method',
  'german-volume-training-ten-sets',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','bodybuilding','high-volume','program-design'],
  'Ten sets of ten reps, same weight, same exercise, minimal rest. It sounds too simple to work — that''s exactly why it does.',
  E'## A method that predates its own name\n\nWhat''s called "German Volume Training" today traces back to 1970s Germany, where it was used in the weightlifting off-season to help lifters gain lean mass quickly — efficient enough that lifters routinely moved up a full weight class in about 12 weeks. Strength coach Charles Poliquin popularized the name in the English-speaking world; a very similar method was independently promoted in the US by Vince Gironda.\n\n### The rule\n\nOne exercise per body part. Ten straight sets of ten reps, with the same weight for every set — a weight you could otherwise lift for about 20 reps to failure (roughly 60% of your 1-rep max). Rest 60-90 seconds between straight sets, 90-120 seconds if performed as a superset. Once you can complete all 10 sets of 10 with your rest intervals intact, add 4-5% to the weight and repeat.\n\nThe program deliberately avoids forced reps, negatives, or burns — the sheer volume of repeated effort against the same weight is what drives the hypertrophy, and it''s usually more than enough on its own. Gains of 10+ pounds in six weeks aren''t unusual, even in experienced lifters, though the soreness that comes with it is legendary — a hard quad-and-hamstring day can leave you limping for the better part of a week.\n\n### A 5-day, not-quite-weekly cycle\n\nThe standard beginner/intermediate split is Chest & Back, Legs & Abs, Off, Arms & Shoulders, Off — a 5-day cycle repeated every 5 days rather than tied to Monday-Sunday. Fit into a calendar week it comfortably leaves two full rest days on top of the built-in off days.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for "German Volume Training (10×10)" under Preset Programs.\n\n---\n\n**Source:** Charles Poliquin, ["German Volume Training!"](http://www.bodybuilding.com/fun/luis13.htm), Bodybuilding.com. This post summarizes and adapts that article''s training notes — see the original for the full write-up, including the follow-up 10×6 phase.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'german-volume-training-ten-sets';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
