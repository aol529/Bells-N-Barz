-- ============================================================
-- BLOG POST: "Vince Gironda's 8×8: The "Honest Workout"" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Vince Gironda''s 8×8: The "Honest Workout"',
  'vince-gironda-8x8-workout',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','bodybuilding','high-volume','program-design'],
  'Vince Gironda''s favorite "shock routine" for advanced bodybuilders: 8 sets of 8 reps, barely any rest, and a strict no-talking rule.',
  E'## The trainer who came before German Volume Training\n\nVince Gironda trained bodybuilders out of his Hollywood gym for decades and was pushing high-volume training concepts long before "German Volume Training" (10 sets of 10) became a household name. His own favorite version was 8 sets of 8 reps — what he called the "honest workout."\n\n### How it actually runs\n\n8 sets of 8 reps per exercise, 2 to 4 exercises per muscle group, only 15 to 30 seconds of rest between sets. Gironda was strict about the tempo rules: no putting the weight down between sets, no re-racking, no conversation, no leaving the bench or machine until all 8 sets of an exercise are done. "This program requires 100% total concentration."\n\nBecause the rest periods are so short, the weight used has to drop substantially — often around 40% less than a normal 8-rep working weight. The overload here doesn''t come from adding weight to the bar; it comes from doing more total work in less time. Whole sessions are meant to fit inside 45 to 60 minutes, working two to three muscle groups.\n\n### Not for beginners, not for every week\n\nGironda was explicit that this isn''t a program to run constantly. It''s a "shock routine" for an advanced bodybuilder (he suggested at least two years of training experience) to break a plateau or bring up a lagging body part — used for a few weeks at a time, then set aside in favor of more conventional training.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for "Vince Gironda''s 8 X 8" under Preset Programs. It''s a genuinely demanding session; make sure a client has real training experience before assigning it.\n\n---\n\n**Source:** ["Vince Gironda''s 8 X 8 Workout"](https://oldschooltrainer.com/vince-girondas-8-x-8-workout/), Old School Trainer. This post summarizes and adapts that article''s training notes — see the original for the full write-up.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'vince-gironda-8x8-workout';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
