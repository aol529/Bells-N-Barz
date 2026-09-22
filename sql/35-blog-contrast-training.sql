-- ============================================================
-- BLOG POST: "Contrast Training: Pairing Heavy Lifts With Explosive Movement" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Contrast Training: Pairing Heavy Lifts With Explosive Movement',
  'contrast-training-explained',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['athletic-performance','power','program-design'],
  'Heavy squat, then a jump squat. The pairing isn''t random — it primes your nervous system to fire harder on the very next rep.',
  E'## The pairing, explained simply\n\nContrast training is a simple idea with a research-backed mechanism behind it: do a heavy set of a lift (5-10 reps), then immediately follow it with an unloaded, explosive version of the same movement pattern at a similar rep count. Squats followed by jump squats. Bench press followed by explosive push-ups or a medicine-ball chest pass. Pull-ups followed by medicine-ball slams.\n\n### Why it works: post-activation potentiation\n\nThe mechanism is called post-activation potentiation, or PAP — after a muscle performs a near-maximal contraction, its explosive capability is temporarily enhanced. Researchers point to a few contributing factors: more motor units get recruited, those motor units synchronize better, and some of the nervous system''s normal "brakes" on all-out force loosen up. The net effect: the same muscle can produce faster, more powerful movement in the minutes right after a heavy set than it could cold.\n\n### A few ready-to-use pairings\n\n- **Knee-dominant** — Barbell Squat → Squat Jump or Box Jump\n- **Hip-dominant** — Deadlift or Romanian Deadlift → Broad Jump or Vertical Jump from a deadlift position\n- **Upper-body push** — Bench Press → Medicine-Ball Chest Pass or Explosive Push-Up\n- **Upper-body pull** — Chin-Up → Medicine-Ball Slam or Explosive Band/Cable Row\n- **Torso rotation** — Band or Cable Rotation → Medicine-Ball Rotational Throw\n\nFor athletes, this builds strength and power at the same time. For general lifters, it''s a way to recruit more high-threshold muscle fibers for hypertrophy or add a metabolic, fat-loss-friendly finisher to a session — slightly higher reps on both halves of the pairing (8-12 instead of 5-10) shifts the emphasis from pure power toward more total training volume.\n\n### How to use this\n\nThis is a technique for pairing exercises, not a weekly split, so there''s no standalone Program Builder preset attached to it — but it''s straightforward to layer onto any of the other presets in this app: add the matching explosive movement right after the main heavy lift on a given day.\n\n---\n\n**Source:** Nick Tumminello, ["Contrast Training for Strength, Size, and Power"](https://archive.t-nation.com/training/contrast-training-for-strength-size-and-power/), T Nation. This post summarizes and adapts that article''s technique notes — see the original for the full exercise library and video demonstrations.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'contrast-training-explained';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
