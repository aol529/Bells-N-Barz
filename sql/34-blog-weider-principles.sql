-- ============================================================
-- BLOG POST: "The Weider Training Principles: A Common Language for Bodybuilding" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'The Weider Training Principles: A Common Language for Bodybuilding',
  'weider-training-principles',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['bodybuilding','training-philosophy','history'],
  'Before there were apps and coaches to explain progressive overload, there was Joe Weider — and a set of named principles that gave an entire sport a shared vocabulary.',
  E'## Naming the ideas everyone already used\n\nJoe Weider spent decades developing and labeling training concepts so bodybuilders would have a common language to describe what they were doing in the gym — the "Weider Training Principles." They aren''t a single routine to follow; they''re a toolkit of named ideas, meant to be layered in as a lifter gets more experienced.\n\n### For beginners\n\n- **Set System Training** — do multiple sets per exercise (2-4 sets of 1-4 exercises per body part) instead of the old single-set-of-12 approach, which produced slow results.\n- **Progressive Overload** — the foundation everything else sits on: keep adding weight, reps, sets, or reducing rest over time, or progress stalls.\n- **Isolation Training** — a common misread. It doesn''t mean an exercise works only one muscle (nothing does); it means some exercises are simply better suited to emphasizing a given body part than others — triceps pressdowns over bench press, for a triceps-focused example.\n\n### For intermediates\n\n- **Split-System Training** — dividing the body across multiple sessions so each muscle group gets more focused volume and intensity than a single full-body workout allows.\n- **Cycle Training** — dedicating blocks of the training year to specific goals (strength, mass, cutting) rather than chasing everything at once.\n- **Superset Training** — pairing two opposing-muscle exercises back to back (like biceps curls with triceps pushdowns), which can also aid recovery since one muscle relaxes while its opposite contracts.\n- **Compound Sets** — supersetting two exercises for the same muscle group instead of opposing ones, for a more concentrated pump.\n- **Muscle Confusion** — regularly varying something in training (sets, reps, exercise order, rest periods) so the body doesn''t fully adapt and progress doesn''t stall.\n- **Forced Reps** — a spotter helps move the bar just enough to complete a few reps past normal failure (the same technique covered in this app''s companion post on old-school intensity techniques).\n\n### Why this still matters\n\nThese aren''t a program in themselves — they''re vocabulary for describing training decisions, several of which show up throughout the other Old School presets in this app (supersets in the golden-era splits, progressive overload in Doug Hepburn''s Program A, cycle training in Frank Zane''s seasonal approach). Understanding the terms makes it easier to recognize the same underlying ideas across very different-looking routines.\n\n### How to use this\n\nThis is a philosophy and vocabulary piece rather than a specific routine, so there''s no standalone Program Builder preset attached to it.\n\n---\n\n**Source:** Jeff Everson & Carey Rossi Walker, "Laws of Physiques: How the Weider Principles Can Turn Training Into a Science," Muscle & Fitness, July 1999. This post summarizes and adapts that article''s explanations of the Weider Training Principles.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'weider-training-principles';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
