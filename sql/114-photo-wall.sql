-- ============================================================
-- PHOTO WALL + PHOTO OF THE WEEK
-- Run after 109-own-wallpapers.sql. Safe to re-run.
--
-- The Wall: members post a photo and a caption; everyone signed in sees
-- it straight away and can give it a thumbs up (one each, tap again to
-- take it back). Members can report a post; three reports hide it until
-- an admin or coach looks. Admins and coaches can hide or show any post;
-- the poster and admins can delete one.
--
-- Photo of the Week: the photo that pops up in the app and on the site.
--   1. An admin's upload for this week (weekly_from in this week) wins.
--   2. Otherwise last week's (Sun-Sat) most-liked Wall post, picked on
--      Sunday automatically: no job needed, it's worked out on asking.
--   3. Otherwise the latest admin upload, so there's always something
--      once one has gone up.
-- Weeks run Sunday to Saturday in the gym's time (gym_local_now, sql/41),
-- like the barbell.
--
-- Photos are in the private wall-photos bucket, under the poster's own
-- folder, and only signed-in people can open them (signed URLs).
-- Everything goes through the functions below; the tables themselves
-- aren't open to the apps, so names other than "First L." never leave
-- the database.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wall-photos', 'wall-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "wall photos: signed in reads" on storage.objects;
create policy "wall photos: signed in reads" on storage.objects for select to authenticated
  using (bucket_id = 'wall-photos' and my_user_id() is not null);

drop policy if exists "wall photos: own folder uploads" on storage.objects;
create policy "wall photos: own folder uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'wall-photos' and (storage.foldername(name))[1] = my_user_id()::text);

drop policy if exists "wall photos: owner or admin deletes" on storage.objects;
create policy "wall photos: owner or admin deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'wall-photos' and ((storage.foldername(name))[1] = my_user_id()::text or is_admin()));

-- weekly_from set = an admin's Photo of the Week upload (not on the Wall).
create table if not exists public.wall_posts (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.users(id) on delete cascade,
  path        text not null,
  caption     text not null default '' check (char_length(caption) <= 200),
  weekly_from date,
  hidden_at   timestamptz,
  hidden_by   uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists wall_posts_created on public.wall_posts (created_at desc);
create index if not exists wall_posts_weekly on public.wall_posts (weekly_from) where weekly_from is not null;

create table if not exists public.wall_likes (
  post_id    uuid not null references public.wall_posts(id) on delete cascade,
  member_id  uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, member_id)
);

create table if not exists public.wall_reports (
  post_id    uuid not null references public.wall_posts(id) on delete cascade,
  member_id  uuid not null references public.users(id) on delete cascade,
  reason     text not null default '' check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  primary key (post_id, member_id)
);

alter table public.wall_posts enable row level security;
alter table public.wall_likes enable row level security;
alter table public.wall_reports enable row level security;
revoke all on public.wall_posts, public.wall_likes, public.wall_reports from anon, authenticated;

-- Admins and coaches look after the Wall.
create or replace function is_wall_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.users where auth_id = auth.uid() and roles && array['admin', 'trainer']::text[]);
$$;

create or replace function wall_week_start()
returns date
language sql
stable
as $$
  select (gym_local_now()::date - extract(dow from gym_local_now())::integer);
$$;

-- "Achieng O." — the leaderboard's style.
create or replace function wall_name(p_full text)
returns text
language sql
immutable
as $$
  select split_part(trim(p_full), ' ', 1) ||
         coalesce(' ' || left(nullif(split_part(trim(p_full), ' ', 2), ''), 1) || '.', '');
$$;

-- ---------------- Photo of the Week ----------------
drop function if exists photo_of_the_week();
create or replace function photo_of_the_week()
returns table (id uuid, path text, caption text, author text, kind text, likes integer, liked boolean, mine boolean, week_of date)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
  ws date := wall_week_start();
  pick uuid;
  how text;
begin
  if me is null then return; end if;
  select p.id into pick from wall_posts p
  where p.weekly_from is not null and p.hidden_at is null and p.weekly_from between ws and gym_local_now()::date
  order by p.weekly_from desc, p.created_at desc limit 1;
  how := 'gym';
  if pick is null then
    select p.id into pick from wall_posts p
    where p.weekly_from is null and p.hidden_at is null
      and (p.created_at at time zone 'Africa/Nairobi')::date between ws - 7 and ws - 1
      and exists (select 1 from wall_likes l where l.post_id = p.id)
    order by (select count(*) from wall_likes l where l.post_id = p.id) desc, p.created_at
    limit 1;
    how := 'winner';
  end if;
  if pick is null then
    select p.id into pick from wall_posts p
    where p.weekly_from is not null and p.hidden_at is null and p.weekly_from <= gym_local_now()::date
    order by p.weekly_from desc, p.created_at desc limit 1;
    how := 'gym';
  end if;
  if pick is null then return; end if;
  return query
  select p.id, p.path, p.caption,
         case when how = 'gym' then 'Bells n Barz' else wall_name(u.full_name) end,
         how,
         (select count(*)::integer from wall_likes l where l.post_id = p.id),
         exists (select 1 from wall_likes l where l.post_id = p.id and l.member_id = me),
         p.member_id = me,
         ws
  from wall_posts p join users u on u.id = p.member_id
  where p.id = pick;
end;
$$;

-- ---------------- The Wall ----------------
-- p_sort 'new' (newest first) or 'top' (this week's, most liked first).
-- Hidden posts only show to their poster and to admins/coaches.
drop function if exists wall_feed(text, integer, integer);
create or replace function wall_feed(p_sort text default 'new', p_limit integer default 30, p_offset integer default 0)
returns table (id uuid, path text, caption text, author text, created_at timestamptz, likes integer, liked boolean,
               mine boolean, hidden boolean, reports integer, reported boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
  is_mod boolean := is_wall_moderator();
  ws date := wall_week_start();
begin
  if me is null then return; end if;
  return query
  select p.id, p.path, p.caption, wall_name(u.full_name), p.created_at,
         (select count(*)::integer from wall_likes l where l.post_id = p.id) as n,
         exists (select 1 from wall_likes l where l.post_id = p.id and l.member_id = me),
         p.member_id = me,
         p.hidden_at is not null,
         case when is_mod then (select count(*)::integer from wall_reports r where r.post_id = p.id) else 0 end,
         exists (select 1 from wall_reports r where r.post_id = p.id and r.member_id = me)
  from wall_posts p join users u on u.id = p.member_id
  where p.weekly_from is null
    and (p.hidden_at is null or p.member_id = me or is_mod)
    and (p_sort <> 'top' or (p.created_at at time zone 'Africa/Nairobi')::date >= ws)
  order by case when p_sort = 'top' then (select count(*) from wall_likes l where l.post_id = p.id) end desc nulls last,
           p.created_at desc
  limit least(greatest(p_limit, 1), 60) offset greatest(p_offset, 0);
end;
$$;

-- Posts a photo already uploaded to the poster's own folder. Ten a day each.
create or replace function wall_post(p_path text, p_caption text default '')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
  new_id uuid;
begin
  if me is null then raise exception 'Sign in to post.'; end if;
  if split_part(p_path, '/', 1) <> me::text then raise exception 'That photo isn''t yours.'; end if;
  if (select count(*) from wall_posts p where p.member_id = me and p.created_at > now() - interval '1 day') >= 10 then
    raise exception 'That''s 10 posts today. Try again tomorrow.';
  end if;
  insert into wall_posts (member_id, path, caption) values (me, p_path, left(trim(coalesce(p_caption, '')), 200))
  returning wall_posts.id into new_id;
  return new_id;
end;
$$;

-- An admin's Photo of the Week. p_from defaults to today; a later date schedules it.
create or replace function wall_set_weekly(p_path text, p_caption text default '', p_from date default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
  new_id uuid;
begin
  if not is_admin() then raise exception 'Only admins can set the Photo of the Week.'; end if;
  if split_part(p_path, '/', 1) <> me::text then raise exception 'That photo isn''t yours.'; end if;
  insert into wall_posts (member_id, path, caption, weekly_from)
  values (me, p_path, left(trim(coalesce(p_caption, '')), 200), coalesce(p_from, gym_local_now()::date))
  returning wall_posts.id into new_id;
  return new_id;
end;
$$;

-- Thumbs up, or takes it back. Returns the new count and whether it's on.
drop function if exists wall_like(uuid);
create or replace function wall_like(p_post uuid)
returns table (likes integer, liked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
  now_on boolean;
begin
  if me is null then raise exception 'Sign in to like.'; end if;
  if not exists (select 1 from wall_posts p where p.id = p_post and (p.hidden_at is null or p.member_id = me)) then
    raise exception 'That post is gone.';
  end if;
  delete from wall_likes l where l.post_id = p_post and l.member_id = me;
  now_on := not found;
  if now_on then insert into wall_likes (post_id, member_id) values (p_post, me); end if;
  return query select (select count(*)::integer from wall_likes l where l.post_id = p_post), now_on;
end;
$$;

-- Three reports from different people hide a post until a moderator shows it again.
create or replace function wall_report(p_post uuid, p_reason text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := my_user_id();
begin
  if me is null then raise exception 'Sign in to report.'; end if;
  insert into wall_reports (post_id, member_id, reason) values (p_post, me, left(trim(coalesce(p_reason, '')), 200))
  on conflict (post_id, member_id) do nothing;
  if (select count(*) from wall_reports r where r.post_id = p_post) >= 3 then
    update wall_posts set hidden_at = coalesce(hidden_at, now()) where id = p_post;
  end if;
end;
$$;

-- Admins and coaches. Showing a post again clears its reports.
create or replace function wall_hide(p_post uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_wall_moderator() then raise exception 'Only admins and coaches can hide posts.'; end if;
  update wall_posts set hidden_at = case when p_hidden then now() end, hidden_by = case when p_hidden then my_user_id() end
  where id = p_post;
  if not p_hidden then delete from wall_reports where post_id = p_post; end if;
end;
$$;

-- The poster or an admin. Returns the file path so the app can remove the photo too.
create or replace function wall_delete(p_post uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  gone text;
begin
  delete from wall_posts p where p.id = p_post and (p.member_id = my_user_id() or is_admin())
  returning p.path into gone;
  if gone is null then raise exception 'You can only delete your own posts.'; end if;
  return gone;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['is_wall_moderator()', 'photo_of_the_week()', 'wall_feed(text, integer, integer)',
    'wall_post(text, text)', 'wall_set_weekly(text, text, date)', 'wall_like(uuid)', 'wall_report(uuid, text)',
    'wall_hide(uuid, boolean)', 'wall_delete(uuid)'] loop
    execute 'revoke all on function ' || f || ' from public, anon';
    execute 'grant execute on function ' || f || ' to authenticated';
  end loop;
end $$;
