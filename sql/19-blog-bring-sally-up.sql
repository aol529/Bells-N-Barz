-- ============================================================
-- BLOG POST: "The Bring Sally Up Challenge" (Health & Appearance)
-- One-off content insert, not a schema/RLS change — blog_posts and its
-- policies already exist (sql/01-schema.sql, sql/blog.sql). Mirrors
-- js/bells-n-barz-blog.js's SEED_POSTS entry of the same slug (kept in
-- sync by hand — the seed array is what a from-scratch install gets,
-- this INSERT is what an already-live project gets, same as how new
-- seed rows are normally introduced going forward).
--
-- `on conflict (slug) do nothing` makes this safe to run more than
-- once (slug has a unique constraint per 01-schema.sql) — matches the
-- same idempotency migrateSeedPosts() already guarantees for the seed
-- array.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'The Bring Sally Up Challenge: What It Actually Trains',
  'bring-sally-up-challenge',
  'Health & Appearance',
  '2026-09-20',
  'Coach KA',
  0,
  '',
  array['challenge','push-ups','core','conditioning'],
  'A 3:32 song turned into a push-up gauntlet — the real difficulty isn''t the rep count, it''s the hold.',
  E'## The workout hiding inside a song\n\nThe Bring Sally Up challenge isn''t a program, it''s a single track (Moby''s "Flower") turned into a push-up gauntlet. The premise is almost insultingly simple: on the "up" cue, you push up. On the "down" cue, you lower until your chest is hovering an inch off the floor, and you hold there, dead still, until the next "up." Repeat until the song ends.\n\n### Why it''s harder than it sounds\n\nTotal rep count over the full track lands around 30 — nothing to write home about on its own. The actual demand is time under tension: every "down" is an isometric hold in the bottom position, not a rest. By the second half of the song, the chest, triceps, and front delts are fighting to stay stable in a dead hang above the floor, over and over, with no real recovery window.\n\n### What it trains\n\n- **Pressing strength-endurance** — not max strength, but the ability to keep producing force under fatigue\n- **Core bracing** — a sagging hip line in that hover position turns the challenge into a bad plank\n- **Pacing discipline** — the track sets the tempo, not you, so sandbagging the holds isn''t an option\n\n### A caution worth saying out loud\n\nThis isn''t a beginner drill. If a strict push-up plank can''t be held for 60+ seconds, or 15+ strict push-ups can''t be done unbroken, the hold-heavy structure here will break form long before the song ends — and bad form under fatigue is exactly how shoulders get hurt. Build the base first.\n\n### Try it in the app\n\nThere''s a Bring Sally Up pacer under **Challenges** in the Members area — it calls "Up" and "Down" on a comparable cadence so the same up/down/hold structure can be run with any music playing, no need to track the original song down. Push-ups are the classic version, but the same up/down pattern works for squats or pull-ups too.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'bring-sally-up-challenge';
-- — one row, category = 'Health & Appearance', status = 'published'.
-- ============================================================
