-- ============================================================
-- WALLPAPER SETTINGS
-- Run after 109-own-wallpapers.sql. Safe to re-run.
--
-- Where a member's wallpaper shows (Home only, everywhere, or page by
-- page), whether it changes on its own (each time the app opens, hourly,
-- daily, weekly), and how strong it is. Kept as one JSON value in
-- member_prefs.wallpaper_settings; null = follow the gym's default,
-- which admins set in app_backdrop_defaults. The app and the website
-- read the same settings and work out the same picture.
--
-- Shape (the apps write it; the database only checks the pictures):
--   { "where": "home" | "all" | "pages",
--     "strength": "subtle" | "normal" | "bold",
--     "main":  Pick,                       -- for "home" and "all"
--     "pages": { "home": Pick, "workout": Pick, "book": Pick,
--                "chat": Pick, "more": Pick } }
--   Pick = { "mode": "default" | "none" | "fixed" | "rotate",
--            "ref": "home" | "g:<wallpaper id>" | "o:<own photo id>",
--            "every": "open" | "hour" | "day" | "week",
--            "set": [refs] }                -- empty = all they've unlocked
--
-- "home" is the gym's Home picture, "g:" a gym wallpaper, "o:" one of the
-- member's own photos. A gym wallpaper still has to be earned, rotating
-- ones included. Pictures already in someone's settings are left alone,
-- so a deleted or re-locked one doesn't stop them saving other changes
-- (the apps skip anything missing).
-- ============================================================

alter table public.member_prefs
  add column if not exists wallpaper_settings jsonb
  check (wallpaper_settings is null or (jsonb_typeof(wallpaper_settings) = 'object' and length(wallpaper_settings::text) <= 8000));

-- Every picture named anywhere in a settings value.
create or replace function wallpaper_refs(s jsonb)
returns setof text
language sql
immutable
as $$
  select distinct v #>> '{}'
  from jsonb_path_query(coalesce(s, '{}'::jsonb), 'strict $.**') as v
  where jsonb_typeof(v) = 'string' and (v #>> '{}') ~ '^[go]:';
$$;

create or replace function member_prefs_wallpaper_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  need integer;
  days integer;
  r text;
  rid uuid;
begin
  -- 109: an own wallpaper must be the member's own.
  if new.own_wallpaper_id is not null
     and (tg_op = 'INSERT' or new.own_wallpaper_id is distinct from old.own_wallpaper_id)
     and not exists (select 1 from member_wallpapers w where w.id = new.own_wallpaper_id and w.member_id = new.member_id) then
    raise exception 'That wallpaper isn''t yours.';
  end if;
  select count(distinct h.date_iso) into days from mls_history h where h.member_id = new.member_id;
  -- 108: a gym wallpaper must be on, and earned.
  if new.wallpaper_id is not null and (tg_op = 'INSERT' or new.wallpaper_id is distinct from old.wallpaper_id) then
    select b.unlock_sessions into need from app_backdrops b where b.id = new.wallpaper_id and b.slot = 'wallpaper' and b.active;
    if not found then raise exception 'That wallpaper isn''t available.'; end if;
    if need is not null and days < need then raise exception 'Train % sessions to unlock that wallpaper.', need; end if;
  end if;
  -- 110: the same for every picture newly named in the settings.
  for r in
    select x from wallpaper_refs(new.wallpaper_settings) x
    except
    select x from wallpaper_refs(case when tg_op = 'UPDATE' then old.wallpaper_settings end) x
  loop
    begin
      rid := substr(r, 3)::uuid;
    exception when others then
      raise exception 'That wallpaper isn''t available.';
    end;
    if r like 'o:%' then
      if not exists (select 1 from member_wallpapers w where w.id = rid and w.member_id = new.member_id) then
        raise exception 'That wallpaper isn''t yours.';
      end if;
    else
      select b.unlock_sessions into need from app_backdrops b where b.id = rid and b.slot = 'wallpaper' and b.active;
      if not found then raise exception 'That wallpaper isn''t available.'; end if;
      if need is not null and days < need then raise exception 'Train % sessions to unlock that wallpaper.', need; end if;
    end if;
  end loop;
  return new;
end;
$$;

-- The gym's default, for members who haven't set their own: one row.
create table if not exists public.app_backdrop_defaults (
  id         integer primary key default 1 check (id = 1),
  settings   jsonb not null default '{"where":"home","strength":"normal","main":{"mode":"default"}}'::jsonb
             check (jsonb_typeof(settings) = 'object' and length(settings::text) <= 8000),
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.app_backdrop_defaults (id) values (1) on conflict (id) do nothing;

alter table public.app_backdrop_defaults enable row level security;

-- Everyone reads it (the website shows it to visitors too); only admins change it.
drop policy if exists "anyone reads backdrop defaults" on public.app_backdrop_defaults;
create policy "anyone reads backdrop defaults" on public.app_backdrop_defaults for select
  to anon, authenticated using (true);

drop policy if exists "admins change backdrop defaults" on public.app_backdrop_defaults;
create policy "admins change backdrop defaults" on public.app_backdrop_defaults for update
  to authenticated using (is_admin()) with check (is_admin());

revoke all on public.app_backdrop_defaults from anon, authenticated;
grant select on public.app_backdrop_defaults to anon, authenticated;
grant update on public.app_backdrop_defaults to authenticated;

-- The default may only name gym pictures, never anyone's own photo.
create or replace function app_backdrop_defaults_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from wallpaper_refs(new.settings) x where x like 'o:%') then
    raise exception 'The gym default can only use the gym''s pictures.';
  end if;
  new.updated_at := now();
  new.updated_by := my_user_id();
  return new;
end;
$$;

drop trigger if exists app_backdrop_defaults_stamp on public.app_backdrop_defaults;
create trigger app_backdrop_defaults_stamp before update on public.app_backdrop_defaults
  for each row execute function app_backdrop_defaults_stamp();

-- Members who already picked something in 108/109 keep it: Home only, that picture.
update public.member_prefs p
set wallpaper_settings = jsonb_build_object('where', 'home', 'strength', 'normal',
      'main', jsonb_build_object('mode', 'fixed', 'ref',
        case when p.own_wallpaper_id is not null then 'o:' || p.own_wallpaper_id else 'g:' || p.wallpaper_id end))
where p.wallpaper_settings is null and (p.wallpaper_id is not null or p.own_wallpaper_id is not null);
