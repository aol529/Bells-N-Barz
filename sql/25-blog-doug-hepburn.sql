-- ============================================================
-- BLOG POST: "Doug Hepburn's Program A: The Simplest Progression That Works" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Doug Hepburn''s Program A: The Simplest Progression That Works',
  'doug-hepburn-program-a',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','strength','powerlifting','program-design'],
  'A Canadian strongman who could squat 600 for reps at 54 built his strength on a scheme simple enough to run on a sticky note.',
  E'## Strong enough to not need anything fancy\n\nDoug Hepburn was a Canadian strongman who won weightlifting gold at the 1953 World Championships, the first natural lifter to bench press 500 pounds, and could still squat 600 for reps at age 54. His signature method — known as Program A — is about as unfussy as strength training gets, and that''s the point.\n\n### The scheme\n\nSquat, bench press, and deadlift are each trained twice a week. Every session for a given lift is 8 sets, and the whole program is really just one progression rule applied over and over:\n\n- **Workout 1:** all 8 sets at 2 reps (roughly 80% of your 1-rep max)\n- **Each workout after that:** one more of the remaining 2-rep sets becomes a 3-rep set\n- **Once all 8 sets read 3 reps** (around workout 8): add 10 lb to the bar and start over at 2 reps\n\nWritten out, the cycle looks like: 2,2,2,2,2,2,2,2 → 2,2,2,2,2,2,2,3 → 2,2,2,2,2,2,3,3 → ... → 3,3,3,3,3,3,3,3, one workout at a time. No max-effort testing, no RPE guesswork, no deload weeks to plan — just a fixed, predictable climb.\n\n### Why it works\n\nAdding 10 lb a month sounds slow, but compounded over a year that''s 120 lb added to each major lift — a genuinely large jump, especially for someone earlier in their training. Because the intensity increase is so gradual, it''s also a program that''s easy to stick with for a long stretch without the burnout that comes from constantly chasing new max attempts.\n\n### Try it yourself\n\nThis progression is a loadable preset in **Coach > Program Builder** — look for "Doug Hepburn''s Program A" under Preset Programs. The preset''s rep field spells out the exact progression rule so it''s visible right in the program.\n\n---\n\n**Source:** ["Extreme Powerbuilding: The Hepburn Method"](https://www.muscleandstrength.com/articles/extreme-powerbuilding-doug-hepburn.html), Muscle & Strength. This post summarizes and adapts that article''s training notes — see the original for the full write-up.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'doug-hepburn-program-a';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
