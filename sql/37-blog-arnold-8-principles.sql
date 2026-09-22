-- ============================================================
-- BLOG POST: "Arnold Schwarzenegger's 8 Training Principles: The Mindset Behind The Oak" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Arnold Schwarzenegger''s 8 Training Principles: The Mindset Behind The Oak',
  'arnold-schwarzenegger-8-training-principles',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['bodybuilding','training-philosophy','mindset'],
  'Arnold Schwarzenegger''s chest-and-back and shoulders-and-arms routines are already old-school classics — but he was just as deliberate about the mindset behind them.',
  E'## Not just what he did — how he thought about it\n\nArnold Schwarzenegger''s training splits from the golden era are already represented in this app''s other Old School presets (the same Mon/Thu Chest & Back → Tue/Fri Shoulders & Arms → Wed/Sat Legs structure traces back to his era). What''s less often covered is the mental approach he wrote and spoke about for decades, which he considered just as important as the exercise selection.\n\n### A few of the principles\n\n- **Lifting requires brain work, too.** Arnold trained with total mental focus, using visualization to "see" the muscle he wanted before and during the set — imagining his biceps as mountains, for instance, and consciously coaxing them to grow rather than just moving the weight.\n- **Train harder than everybody else.** Arnold''s stated goal wasn''t to be as good as his competition, it was to be unmistakably better — which meant treating every session as an opportunity to outwork the room, not just complete the prescribed sets.\n- **Prioritize your weak points.** Arnold trained the body parts he judged weakest first in a session, while fresh and able to give them maximum intensity, rather than leaving them for the end of a tired workout.\n- **Use variety deliberately.** Rather than sticking to one routine indefinitely, Arnold regularly changed exercises, angles, and techniques specifically to keep forcing the muscle to adapt to something new.\n\n### Why this is worth reading even with the routines already covered\n\nA written program only captures exercises, sets, and reps — it can''t capture the intensity, focus, or self-belief a lifter brings to each set, and Arnold was explicit that those mental factors were a deliberate part of his training, not an afterthought. Pair this mindset with any of the other Old School presets rather than treating it as a separate program.\n\n### How to use this\n\nThis is a set of training principles and mindset guidance rather than a specific routine, so there''s no standalone Program Builder preset attached to it.\n\n---\n\n**Source:** David Robson & Bill Geiger, ["Arnold Schwarzenegger''s 8 Best Training Principles"](http://www.bodybuilding.com/fun/arnold-schwarzenegger-8-best-training-principles.html), Bodybuilding.com. This post summarizes and adapts that article''s explanations — see the original 4-part series for Arnold''s full commentary, including his specific chest/back, shoulders/arms, and legs/abs workouts.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'arnold-schwarzenegger-8-training-principles';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
