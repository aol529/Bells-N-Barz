-- ============================================================
-- BLOG POST: "Lee Haney's 3-On-1-Off Split: How an 8-Time Mr. Olympia Trained" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
-- Cites the source article by name and URL at the end of the body (Generation Iron).
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Lee Haney''s 3-On-1-Off Split: How an 8-Time Mr. Olympia Trained',
  'lee-haney-3-on-1-off-split',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','bodybuilding','program-design','mr-olympia'],
  'Lee Haney won eight straight Mr. Olympia titles on a split that doesn''t care what day of the week it is.',
  E'## A split that ignores the calendar\n\nLee Haney holds a share of the record for the most Mr. Olympia wins (eight, 1984-1991, since matched by Ronnie Coleman). His training approach differs from the other Old School presets in this app in one structural way that''s easy to miss: it isn''t locked to specific weekdays at all.\n\n### The actual pattern\n\nThree training days, then one rest day, repeating continuously:\n\n1. **Chest & Arms**\n2. **Legs**\n3. **Back & Shoulders**\n4. **Rest**\n\n...then back to Chest & Arms, regardless of what day of the week that lands on. Calves and abs were trained on every training day. Because 4 doesn''t divide evenly into a 7-day week, the actual rest day drifts by one weekday every cycle if you run it exactly as written — Thursday rest one week, then whatever weekday the cycle lands on next.\n\n### Why the preset in this app looks different\n\nProgram Builder assigns exercises per calendar weekday, so the loadable preset fits one full pass of the cycle into Monday through Sunday (Mon/Fri Chest & Arms, Tue/Sat Legs, Wed/Sun Back & Shoulders, Thursday rest) rather than truly drifting. That''s a reasonable way to run it, but it''s not identical to the original protocol — if you want the exact drifting rest day, track "day number in the cycle" instead of day of the week.\n\n### The training itself\n\nRep ranges run moderate compared to the other Old School presets here — mostly 6-10 reps on compound lifts, 12-15 on accessory and calf work, 4 to 5 sets per exercise rather than 5-8. A few exercises (leg press, stiff leg deadlift) were only used one workout in every three, rotated in rather than run every single leg day.\n\n### Try it yourself\n\nThis routine is a loadable preset in **Coach > Program Builder** — look for "Lee Haney''s 3-On-1-Off Split" under Preset Programs.\n\n---\n\n**Source:** ["Old School Workout: Lee Haney"](https://generationiron.com/old-school-workout-lee-haney/), Generation Iron. This post summarizes and adapts that article''s training notes — see the original for the full write-up and a second workout variation to alternate in.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'lee-haney-3-on-1-off-split';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
