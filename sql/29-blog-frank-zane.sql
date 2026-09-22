-- ============================================================
-- BLOG POST: "Frank Zane's Torso/Legs/Arms Split: Quality Over Quantity" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Frank Zane''s Torso/Legs/Arms Split: Quality Over Quantity',
  'frank-zane-torso-legs-arms-split',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','bodybuilding','program-design','aesthetics'],
  'Three-time Mr. Olympia Frank Zane built one of bodybuilding''s most admired physiques on just two working sets per exercise.',
  E'## Less volume than you''d expect\n\nFrank Zane won Mr. Olympia three years running (1977-79) at a bodyweight around 185-190 pounds, competing against much heavier rivals, and is still frequently cited as having one of the most aesthetically proportioned physiques the sport has produced. His signature "Zane Experience" routine looks almost minimalist compared to the other Old School presets here: just two working sets per exercise.\n\n### The split\n\nThree training days, each covering a distinct region:\n\n- **Torso day** — back, shoulders, and chest (the hardest session, done right after a rest day)\n- **Legs day** — thighs and calves (a bit easier)\n- **Arms day** — triceps, biceps, and forearms (the easiest, since these are small muscle groups)\n\nAbs are trained at the end of every session. Zane deliberately ordered the split hardest-to-easiest across the week, calling it "a great psychological advantage to have your split routine get easier as you go through it."\n\n### Two sets, real effort\n\nEach exercise gets exactly two working sets: the first around 12 reps, then a heavier weight for a second set around 10 reps. Instead of timed rest between sets, Zane used a brief targeted stretch of the muscle just worked (roughly 15 seconds) before moving on. It''s a much lower total set count than German Volume Training or Gironda''s 8×8 — Zane''s approach leans on precise exercise selection and full mental focus on each rep rather than sheer volume.\n\n### A cycle that changes with the season\n\nZane didn''t run the same frequency year-round — he described maintenance-season cycles (once every 6-7 days), a faster "growth" cycle for spring/summer (train 3 days, rest 1, repeating), and everything in between. This preset uses his own recommended maintenance cycle (Monday/Wednesday/Friday, each body part once every 7 days) as the simplest, most sustainable starting point.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for "Frank Zane''s Torso/Legs/Arms Split" under Preset Programs. A few of Zane''s own exercise choices used specialty equipment from his personal home gym; the preset substitutes standard gym-equivalent exercises where needed.\n\n---\n\n**Source:** Frank Zane, *The Zane Body Training Manual* (Zananda Incorporated, ISBN 0-9636167-3-0). This post summarizes and adapts the book''s "Zane Experience Workout Program" chapter — see the original for Zane''s full commentary, nutrition guidance, and posing instruction.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'frank-zane-torso-legs-arms-split';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
