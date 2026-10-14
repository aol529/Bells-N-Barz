-- ============================================================
-- LIBRARY (the books behind Bells n Barz)
-- Run after 76-forgot-password.sql. Safe to re-run.
--
-- A shelf of the books that inspired the gym: cover, title, author, a
-- "why this book" note, short takeaways in our own words, an optional
-- short quote and a link to buy the book. No book text is stored here —
-- the books are still in copyright, so the shelf points people to them.
--
-- Everyone (signed in or not) can read visible books; staff add, edit,
-- reorder and hide them from Library > Admin. Covers upload to the public
-- 'library-covers' bucket. The whole page sits behind the 'library'
-- switch in Admin > Switchboard.
-- ============================================================

create table if not exists public.library_books (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  author     text not null default '',
  cover_url  text not null default '',
  why        text not null default '',
  takeaways  text[] not null default '{}',
  quote      text not null default '',
  buy_url    text not null default '',
  sort_order integer not null default 0,
  hidden     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.library_books enable row level security;

drop policy if exists "anyone reads visible books" on public.library_books;
create policy "anyone reads visible books"
  on public.library_books for select
  using (not hidden or is_staff());

drop policy if exists "staff manage books" on public.library_books;
create policy "staff manage books"
  on public.library_books for all
  using (is_staff())
  with check (is_staff());

grant select on public.library_books to anon, authenticated;
grant insert, update, delete on public.library_books to authenticated;

-- ---------------- Covers bucket ----------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('library-covers', 'library-covers', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "library covers: anyone reads" on storage.objects;
create policy "library covers: anyone reads" on storage.objects for select
  using (bucket_id = 'library-covers');

drop policy if exists "library covers: staff upload" on storage.objects;
create policy "library covers: staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'library-covers' and is_staff());

drop policy if exists "library covers: staff update" on storage.objects;
create policy "library covers: staff update" on storage.objects for update to authenticated
  using (bucket_id = 'library-covers' and is_staff());

drop policy if exists "library covers: staff delete" on storage.objects;
create policy "library covers: staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'library-covers' and is_staff());

-- ---------------- Switch ----------------
insert into public.feature_switches (key, enabled) values ('library', true)
on conflict (key) do nothing;

-- ---------------- First books ----------------
-- Drafts in our own words, to be rewritten in Library > Admin.
insert into public.library_books (title, author, why, takeaways, quote, buy_url, sort_order)
select 'The New Rules of Lifting Supercharged', 'Lou Schuler & Alwyn Cosgrove',
  'My first reference as a personal trainer. It taught me to build programmes from movement patterns rather than body parts, and to plan training in phases with a clear purpose. Much of how Bells n Barz programmes are laid out started here.',
  array[
    'Train movements, not muscles: squat, hinge, push, pull and lunge.',
    'Every programme runs in phases. Each one has a job, then you move on.',
    'Warm up with purpose: get the joints and muscles ready for the lifts ahead.',
    'Train the core to resist movement and keep the spine steady, not just to crunch.',
    'Men and women can follow the same rules. Lifting heavy builds strength and shape for both.'
  ],
  '',
  '',
  5
where not exists (select 1 from public.library_books where title ilike 'The New Rules of Lifting Supercharged%');

insert into public.library_books (title, author, why, takeaways, quote, buy_url, sort_order)
select 'Never Let Go: A Philosophy of Lifting, Living and Learning', 'Dan John',
  'Short, plain lessons from a coach who has spent a lifetime under the bar. No fads and no fuss: show up, do the basics well, and keep at it for years. That is the spirit Bells n Barz is built on.',
  array[
    'Keep the goal the goal. Decide what you are training for and let everything else wait.',
    'Everything works, for a while. Change the plan when it stops working, not when you get bored.',
    'Master the basics: push, pull, hinge, squat, carry. Most of the results live there.',
    'Some days you train hard, most days you just put in the work. Both count.',
    'Lifting teaches life: patience, honesty about where you are, and showing up again tomorrow.'
  ],
  'The goal is to keep the goal the goal.',
  'https://www.otpbooks.com/',
  10
where not exists (select 1 from public.library_books where title ilike 'Never Let Go%');

insert into public.library_books (title, author, why, takeaways, quote, buy_url, sort_order)
select '1% Fitness: Move Better. Train Smarter. Live Longer.', 'Mike Sheridan',
  'It boils training down to four movements our ancestors did every day just to live: push, pull, bend and extend. Bells n Barz programmes are built around them, with the hip hinge given pride of place because it is what keeps your back safe outside the gym.',
  array[
    'Train the four major movements: push, pull, bend (squat) and extend (hip hinge).',
    'Push is any press away from the body: in front, overhead or anywhere in between.',
    'Pull is climbing and rowing: pull-ups, pulldowns and rows.',
    'Bend is the knee bend. Squat first, lunge close behind.',
    'Extend is the hip hinge: hips back, then drive them forward to stand. Prioritise it.',
    'If you can pick up your own bodyweight with good form, lifting shopping or a heavy bag at home will not hurt your back.'
  ],
  'The main reason we should prioritize the hip extension is because it prevents injuries.',
  '',
  20
where not exists (select 1 from public.library_books where title ilike '1% Fitness%');
