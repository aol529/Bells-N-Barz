-- ============================================================
-- FIX BROKEN BLOG SOURCE LINKS
-- Run after 50-blood-pressure-and-steps.sql. Safe to re-run: each
-- replace() is a no-op once the old link is gone.
--
-- Three source citations stopped working (link check, Oct 2026):
--   * German Volume Training: bodybuilding.com/fun/luis13.htm now
--     redirects to the bodybuilding.com membership shop -> Internet
--     Archive copy (Nov 2016).
--   * Arnold's 8 Training Principles: the bodybuilding.com article is
--     a 404 -> Internet Archive copy (Dec 2016).
--   * Old School 70s split: gustavomirabal.ch no longer exists and
--     was never archived -> citation kept as plain text, no link.
-- ============================================================

update public.blog_posts
set body = replace(body,
  'http://www.bodybuilding.com/fun/luis13.htm',
  'https://web.archive.org/web/20161120063251/http://www.bodybuilding.com/fun/luis13.htm')
where slug = 'german-volume-training-ten-sets';

update public.blog_posts
set body = replace(body,
  'http://www.bodybuilding.com/fun/arnold-schwarzenegger-8-best-training-principles.html',
  'https://web.archive.org/web/20161207232058/http://www.bodybuilding.com/fun/arnold-schwarzenegger-8-best-training-principles.html')
where slug = 'arnold-schwarzenegger-8-training-principles';

update public.blog_posts
set body = replace(body,
  '["The Old School 70''s Bodybuilding Routine"](https://gustavomirabal.ch/health/the-old-school-70s-bodybuilding-routine-gustavo-mirabal/)',
  '"The Old School 70''s Bodybuilding Routine" (gustavomirabal.ch, no longer online)')
where slug = 'old-school-70s-bodybuilding-split';

-- Check: should return no rows.
-- select slug from public.blog_posts
-- where body like '%bodybuilding.com/fun/luis13.htm%' and body not like '%web.archive.org%'
--    or body like '%arnold-schwarzenegger-8-best%' and body not like '%web.archive.org%'
--    or body like '%](https://gustavomirabal.ch%';
