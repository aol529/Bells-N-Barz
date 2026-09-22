-- ============================================================
-- BLOG POST: "The Old School 70's Bodybuilding Split" (Health & Appearance)
-- One-off content insert, not a schema/RLS change — same shape as
-- sql/19-blog-bring-sally-up.sql. Mirrors the matching entry in
-- js/bells-n-barz-blog.js's SEED_POSTS. Cites the source article by
-- name, author, and URL at the end of the body (the user asked for
-- citations specifically — see the post's closing "Source:" line).
--
-- `on conflict (slug) do nothing` makes this safe to run more than once.
-- ============================================================

insert into public.blog_posts (title, slug, category, date, author, views, cover, tags, excerpt, body, status)
values (
  'The Old School 70''s Bodybuilding Split: How the Golden Era Trained',
  'old-school-70s-bodybuilding-split',
  'Health & Appearance',
  '2026-09-22',
  'Coach KA',
  0,
  '',
  array['old-school','bodybuilding','program-design','volume'],
  'High volume, a three-day body-part rotation, and a diet built on raw eggs and steak — how Arnold''s generation actually trained.',
  E'## Why the "golden era" look still gets referenced\n\nAsk anyone to picture a "classic" bodybuilder physique and they''re picturing the 1970s: wide shoulders and lats tapering to a small waist, visible abs at a bodyfat level that still looked athletic rather than stage-lean year-round. That look — the V-taper — came from a specific training approach, not a supplement stack.\n\n### The split\n\nThree body-part groups, each hit twice a week, one full rest day:\n\n- **Monday & Thursday** — Chest & Back\n- **Tuesday & Friday** — Shoulders & Arms\n- **Wednesday & Saturday** — Legs\n- **Sunday** — Rest\n\nAbs, calves, forearms, and neck were trained separately, 4–6 times a week, as needed rather than on a fixed schedule.\n\n### How each session actually ran\n\nFive sets per exercise was the default, with reps generally in the 8–12 range (legs ran looser, 5–20). The first exercise of the day — usually the heaviest compound lift — was pyramided: start light, add weight every set, and finish the last set as heavy as possible for as few as 1–2 reps. That first lift was meant to "activate" the rest of the session.\n\nArnold Schwarzenegger''s signature variation was supersetting opposing muscle groups — a set of Bench Press immediately followed by a set of Chinups, no rest between, repeated for all 5 sets. Rest periods generally stayed short: about a minute between sets or supersets.\n\nOnce a week, one exercise (Bench Press, Squat, or Deadlift) was taken to a genuine one-rep max as a strength check — not a weekly habit for every lift, just a periodic test.\n\n### Diet: built on volume, not precision\n\nThe golden-era approach to eating matched the training: a lot of protein and saturated fat, with carbohydrate intake cycled up during bulking phases and down while cutting. Steak, chicken, tuna, and — notably — raw eggs were staple protein sources; homemade shakes were often just raw eggs, milk powder, and whatever else was on hand.\n\n**Worth flagging**: raw eggs carry a real salmonella risk that wasn''t well understood or taken seriously in the 1970s. If replicating this diet, pasteurized eggs are the safer substitute for anything eaten raw.\n\n### Try it yourself\n\nThis split is now a loadable preset in **Coach > Program Builder** — select a client, choose "Old School 70''s Split" under Preset Programs, and it populates their full week in one click.\n\n---\n\n**Source:** Gustavo Mirabal Castro, ["The Old School 70''s Bodybuilding Routine"](https://gustavomirabal.ch/health/the-old-school-70s-bodybuilding-routine-gustavo-mirabal/), published January 10, 2020, gustavomirabal.ch. This post summarizes and adapts that article''s training and diet notes — see the original for the author''s full commentary.',
  'published'
)
on conflict (slug) do nothing;

-- ============================================================
-- Verify:
-- select title, slug, category, status from public.blog_posts
--   where slug = 'old-school-70s-bodybuilding-split';
-- — one row, category = 'Health & Appearance', status = 'published'.
-- ============================================================
