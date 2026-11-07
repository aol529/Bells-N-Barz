-- ============================================================
-- MEMBER WALLPAPERS
-- Run after 107-app-backdrops.sql and 84-leaderboard-challenges.sql
-- (member_prefs). Safe to re-run.
--
-- A member picks one of the wallpapers (app_backdrops, slot
-- 'wallpaper') to show behind Home instead of the gym's picture, in the
-- app and on the website. The choice is kept in member_prefs, so it
-- follows them from phone to computer. Null = the gym's Home picture.
--
-- A wallpaper with unlock_sessions is earned: it opens once the member
-- has that many training days with a saved Live Session (mls_history),
-- the same count the leaderboard's "sessions" uses. The database checks
-- this, so it can't be skipped by editing the page.
-- ============================================================

alter table public.member_prefs
  add column if not exists wallpaper_id uuid references public.app_backdrops(id) on delete set null;

-- The caller's training days, for the "3 more sessions" hints.
create or replace function my_session_days()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct h.date_iso)::integer from mls_history h where h.member_id = my_user_id();
$$;

revoke all on function my_session_days() from public, anon;
grant execute on function my_session_days() to authenticated;

-- Only a wallpaper that's on, and earned, can be chosen.
create or replace function member_prefs_wallpaper_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  need integer;
begin
  if new.wallpaper_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.wallpaper_id is not distinct from old.wallpaper_id then return new; end if;
  select b.unlock_sessions into need
  from app_backdrops b
  where b.id = new.wallpaper_id and b.slot = 'wallpaper' and b.active;
  if not found then raise exception 'That wallpaper isn''t available.'; end if;
  if need is not null and
     (select count(distinct h.date_iso) from mls_history h where h.member_id = new.member_id) < need then
    raise exception 'Train % sessions to unlock that wallpaper.', need;
  end if;
  return new;
end;
$$;

drop trigger if exists member_prefs_wallpaper_check on public.member_prefs;
create trigger member_prefs_wallpaper_check before insert or update on public.member_prefs
  for each row execute function member_prefs_wallpaper_check();

-- Make some of the placeholder wallpapers rewards, so there's something to
-- earn from day one. Only pictures no admin has touched yet (updated_by is
-- null), so this never undoes a change made on the Backgrounds page.
update public.app_backdrops b
set unlock_sessions = v.n
from (values ('The rack', 5), ('Chalk dust', 10), ('Moon over the bar', 25), ('Bells n Barz', 50)) as v(name, n)
where b.slot = 'wallpaper' and b.placeholder and b.updated_by is null
  and b.name = v.name and b.unlock_sessions is null;
