-- ============================================================
-- BLOG POST: "The Bulgarian Method: Why the Most Effective Program Isn't for You" (Health & Appearance)
-- One-off content insert, not a schema/RLS change -- same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS.
--
-- on conflict (slug) do nothing makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'The Bulgarian Method: Why the Most Effective Program Isn''t for You',
  'the-bulgarian-method-explained',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['weightlifting','powerlifting','training-philosophy'],
  'The Bulgarian national weightlifting team dominated the sport for 25 years training near-daily maxes. It''s also one of the clearest examples of a program that''s genuinely dangerous for the wrong person.',
  E'## A program built for a very specific athlete\n\nThe Bulgarian Method, developed by coach Ivan Abadjiev starting in the 1960s, is credited with an extraordinary run of Olympic weightlifting dominance — for roughly 25 years, no world record was considered safe from the Bulgarian team. The method itself is almost shockingly simple to describe: squat, snatch, and clean & jerk, multiple times a day, nearly every day, at or near your daily max, with only one or two reps per set.\n\n### Why it isn''t included as a preset here\n\nThis app doesn''t offer the Bulgarian Method as a Program Builder preset, and that''s a deliberate choice, not an oversight. The source article — written by an experienced weightlifting coach who has personally used this system — is explicit that it was designed for elite, genetically gifted athletes (ideally 15-18 years old, already training at a high level for 5-8 years, ranked in the top three nationally in their federation) and requires constant supervision from an experienced, relentless coach who can judge in real time whether an athlete should be squatting that day or resting. It is not a program a member should self-select from a dropdown, or that a coach should assign without the exact kind of hands-on daily judgment the source describes.\n\n### What makes it dangerous outside that context\n\nDaily near-max attempts on the competition lifts, with minimal deload structure, place enormous and continuous stress on connective tissue and the nervous system. Elite Bulgarian-team athletes could handle that because of a combination of genetics, years of prior training, and expert coaching making constant real-time load decisions. Without all three of those pieces in place, the far more likely outcome is injury or burnout rather than the legendary results the method is known for.\n\n### The takeaway\n\nThe Bulgarian Method is worth understanding as a piece of weightlifting history and as the far extreme of the frequency/intensity spectrum — genuinely useful context when discussing training philosophy with clients. It isn''t worth attempting without an experienced weightlifting coach physically present to run it.\n\n---\n\n**Source:** Jim Moser, ["The Bulgarian Method of Training Olympic Weightlifters"](https://startingstrength.com/article/the_bulgarian_method_of_training_olympic_weightlifters), Starting Strength. This post summarizes and adapts that article''s history and training notes — see the original for the full write-up.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'the-bulgarian-method-explained';
-- one row, category = Health & Appearance, status = published.
-- ============================================================
