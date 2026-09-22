-- ============================================================
-- BLOG POST: "Ed Coan's 10-Week Deadlift Program: Peaking With Percentages" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Ed Coan''s 10-Week Deadlift Program: Peaking With Percentages',
  'ed-coan-10-week-deadlift-program',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['powerlifting','deadlift','program-design'],
  'Widely considered the greatest powerlifter of all time, Ed Coan''s deadlift program built a friend''s pull by 35 pounds in ten weeks — using percentages, not guesswork.',
  E'## Built for a friend, not for himself\n\nEd Coan set 71 world records over his powerlifting career and is routinely called the greatest powerlifter of all time — a 6''0", 220lb lifter with a best deadlift of 901 pounds. This particular 10-week program wasn''t written for Coan''s own training; he designed it for training partner Mark Phillipi (who went on to win America''s Strongest Man), and Phillipi credited it with taking his deadlift from 505 to 540 pounds.\n\n### The structure\n\nEverything in the 10 weeks centers on the deadlift specifically, run once a week alongside a lifter''s regular training:\n\n- **Work sets** — a single heavy set climbing from 75% of your target max in week 1 up to a new PR attempt at 100%+ by week 10-11\n- **Speed sets** — multiple lighter, faster sets (starting around 8 sets of 3 at 60%) that taper down in both volume and load as the work sets get heavier\n- **Assistance circuit** — stiff-legged deadlifts, bent-over rows, underhand lat pulldowns, and arched-back good mornings, run as a circuit early in the program and as straight sets later on\n\nThe logic is pure specificity: if you want your deadlift to go up, the deadlift itself — trained at a range of loads and speeds — needs to be the centerpiece, not accessory work alone.\n\n### What to expect\n\nThis is described by the source as "not for the faint hearted" — a real mental and physical test, with significant lower-back and hamstring soreness in the first few weeks that can spill over into other lifts (squats in particular). Plan on eating and recovering accordingly.\n\n### How to use this\n\nBecause it''s designed to run alongside a lifter''s existing program rather than replace it, this isn''t offered as a standalone Program Builder preset — loading it the normal way would wipe out the rest of a client''s week for the sake of one lift. Add the deadlift work sets, speed sets, and assistance circuit to a client''s existing Back or Legs day by hand instead.\n\n---\n\n**Source:** ["Ed Coan''s 10 Week Deadlift Routine Review"](https://gymtalk.com/ed-coan-deadlift-routine-review/), GymTalk. This post summarizes and adapts that article''s training notes — see the original for the full write-up.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'ed-coan-10-week-deadlift-program';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
