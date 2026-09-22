-- ============================================================
-- BLOG POST: "The Steve Reeves Classic Physique Routine: Training Before the Split Era" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'The Steve Reeves Classic Physique Routine: Training Before the Split Era',
  'steve-reeves-classic-physique-routine',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','bodybuilding','full-body','program-design'],
  'Before body-part splits, the bodybuilders with arguably the best physiques of all time trained the whole body, three times a week, for hours at a stretch.',
  E'## The physique that started it all\n\nSteve Reeves — a Mr. Universe winner and 1950s movie star — is still held up by many as the most naturally well-proportioned physique bodybuilding has ever produced. Reeves himself was an outspoken critic of the split-training, steroid-fueled direction the sport later took, and continued advocating full-body training for his entire life.\n\n### One workout, thirteen exercises\n\nUnlike the body-part splits in the other Old School presets, this is genuinely full-body: chest, back, shoulders, arms, and legs all get hit in a single session — first published in the May 1951 issue of Your Physique magazine. It runs three non-consecutive days a week (Reeves suggested Monday morning, Wednesday evening, Saturday morning), with the same 13-exercise session repeated each time.\n\nEvery set is taken to genuine failure, with a slow, controlled tempo (roughly 2 seconds up, 3 seconds down) and 45-60 seconds rest between sets, 2 full minutes between exercises. The whole session takes hours — Reeves reportedly spent 2 to 4 hours per workout, working with total focus and no socializing until he was done.\n\n### Why full-body, three days a week\n\nWith only three sessions and every major muscle group hit each time, this gives roughly 48-72 hours of recovery before the same muscle is trained again — plenty, even with genuinely hard, to-failure sets. It''s a very different recovery model than a 4-6 day split where a muscle group might only get trained once a week but the whole body never gets a true day fully off.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for "Steve Reeves'' Classic Physique Routine" under Preset Programs.\n\n---\n\n**Source:** ["The Steve Reeves ''Classic Physique'' Routine"](https://gymtalk.com/steve-reeves-classic-physique-routine/), GymTalk. This post summarizes and adapts that article''s training notes — see the original for the full write-up.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'steve-reeves-classic-physique-routine';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
