-- ============================================================
-- BLOG POST: "Old School Intensity Techniques" (Health & Appearance)
-- One-off content insert, not a schema/RLS change — same shape as
-- sql/19-blog-bring-sally-up.sql and sql/20-blog-old-school-70s.sql.
-- Mirrors the matching entry in js/bells-n-barz-blog.js's SEED_POSTS.
-- Cites the source article by name, author, and URL at the end of the
-- body (Jordan, "The Old School 70's Bodybuilding Routine", Iron & Grit).
--
-- `on conflict (slug) do nothing` makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'Old School Intensity Techniques: Forced Reps, Drop Sets & Rest-Pause',
  'old-school-intensity-techniques',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','bodybuilding','intensity-techniques','program-design'],
  'The golden-era split gets the attention, but it was the techniques layered on top — forced reps, drop sets, rest-pause — that made the volume actually work.',
  E'## The split is only half the story\n\nA second look at the classic golden-era routine — same three body-part groups, just resequenced to Chest & Back, then Legs, then Shoulders & Arms, each twice a week with Sunday off. The structure alone isn''t what made it brutal, though. What made it brutal was a small toolkit of intensity techniques stacked on top of straight sets, used deliberately to push past normal failure rather than around it.\n\n### The toolkit\n\n- **Forced reps** — once a set stalls, a spotter helps move just enough of the bar to grind out a few more reps beyond a normal stopping point.\n- **Drop sets** — hit failure, immediately drop to a lighter weight and keep going, then drop again; two or three drops is usually enough to finish a muscle off.\n- **Rest-pause** — stop just short of failure, take a few seconds to breathe, then squeeze out another short burst; repeat a few times inside what looks like one long "set."\n- **Negatives** — control the lowering phase as slowly as possible, sometimes with a spotter lifting the concentric so only the eccentric is trained; brutal on the muscle, easy to overuse.\n- **Max contractions** — hold the peak-squeeze position of the last rep for several seconds instead of releasing straight away.\n- **Supersets, tri-sets, and mega-sets** — two, three, or more exercises run back-to-back with no rest, the same superset logic the companion split article covers, just extended further.\n\n### How they actually got used\n\nThese weren''t all stacked onto every set of every exercise — that''s a fast route to burnout and injury. The pattern was closer to: run straight sets for most of the work, then reach for one technique on the last set or two of a movement, once the muscle was already close to done. A single drop set or rest-pause finisher at the end of a lift did more than adding another full set from fresh.\n\n### Worth saying plainly\n\nThese techniques assume a base of straightforward training is already in place — a lifter who can''t yet complete a normal working set with good form has no business chasing forced reps or negatives, which load a fatigued or compromised joint harder than anything else on this list. It''s also worth being honest that a lot of the era''s top competitors trained on performance-enhancing drugs, which meaningfully changed how much of this volume and intensity a body could actually recover from. Treat the split and the intensity techniques as separate decisions — a natural lifter can use either without the other, and doesn''t need to match a golden-era pro''s total workload to see the split work.\n\n### Try it yourself\n\nThe resequenced split (Chest/Back → Legs → Shoulders/Arms) is a second loadable preset in **Coach > Program Builder** — look for "Old School 70''s Routine (Iron & Grit)" under Preset Programs.\n\n---\n\n**Source:** Jordan, ["The Old School 70''s Bodybuilding Routine"](https://ironandgrit.com/2016/08/13/old-school-bodybuilding-workout-routine/), Iron & Grit. This post summarizes and adapts that article''s intensity-technique and training notes — see the original for the author''s full commentary.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'old-school-intensity-techniques';
-- — one row, category = 'Health & Appearance', status = 'published'.
-- ============================================================
