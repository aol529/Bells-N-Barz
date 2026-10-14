-- ============================================================
-- LIBRARY: the original gym bible
-- Run after 77-library.sql. Safe to re-run.
--
-- Adds Arnold's encyclopedia to the top of the shelf. A draft in our own
-- words, to be rewritten in Library > Admin.
-- ============================================================

insert into public.library_books (title, author, why, takeaways, quote, buy_url, sort_order)
select 'The New Encyclopedia of Modern Bodybuilding', 'Arnold Schwarzenegger with Bill Dobbins',
  'The original gym bible. Before any other book, this is where the training, the exercises and the love of the iron came from. Bells n Barz still goes back to it.',
  array[
    'Build the foundation first: master the basic lifts before chasing advanced techniques.',
    'Train each muscle from more than one angle for complete development.',
    'Put your mind in the muscle. Feel every rep, don''t just move the weight.',
    'Find your weak points and give them extra work.',
    'Progress comes from steady, honest effort over years, backed by good food and rest.'
  ],
  '',
  '',
  1
where not exists (select 1 from public.library_books where title ilike 'The New Encyclopedia of Modern Bodybuilding%');
