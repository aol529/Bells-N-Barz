-- ============================================================
-- ACCOUNTABILITY GROUP STREAKS
-- Adds each member's current check-in streak to the My Teams group
-- feed, so a group sees not just today's workout but who's actually
-- on a roll — the "social/streaks" pairing from the original roadmap.
--
-- The streak rule below is not a simple consecutive-days count — it's
-- copied exactly from the existing client-side currentStreak(userId) in
-- "bells n barz (main file).html" (used today on a member's own Profile
-- page): a 1-day rest gap is always fine, a 2-day rest gap is only fine
-- if the rest immediately before it was a 1-day rest (no two consecutive
-- 2-day rests), and a gap of 3+ days always breaks it. Written as a
-- plpgsql loop mirroring that function's loop almost line-for-line,
-- rather than a set-based query, specifically so this SQL version can't
-- quietly drift from the behavior members already see on their own
-- Profile page.
-- ============================================================

create or replace function checkin_streak(uid uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  dates date[];
  streak int;
  prev_gap int := null;
  gap int;
  i int;
begin
  select array_agg(date order by date desc) into dates
  from public.checkins where user_id = uid;

  if dates is null or array_length(dates, 1) = 0 then
    return 0;
  end if;

  streak := 1;
  for i in 1 .. array_length(dates, 1) - 1 loop
    gap := dates[i] - dates[i+1]; -- 1=daily, 2=1-day rest, 3=2-day rest
    if gap = 1 or gap = 2 then
      streak := streak + 1;
      prev_gap := gap;
    elsif gap = 3 and prev_gap is distinct from 3 then
      streak := streak + 1;
      prev_gap := gap;
    else
      exit;
    end if;
  end loop;

  return streak;
end;
$$;

-- ---------------- Extend the group feed with each member's streak ----------------
-- Postgres won't let CREATE OR REPLACE change a table-returning function's
-- column set (adding `streak` here counts as a change) — has to be
-- dropped first.

drop function if exists accountability_group_feed(uuid, text);

create function accountability_group_feed(p_group_id uuid, p_day_key text default null)
returns table (
  user_id uuid,
  full_name text,
  avatar text,
  is_me boolean,
  last_checkin date,
  checkins_last_7_days integer,
  streak integer,
  today_day_key text,
  today_blocks jsonb,
  is_rest_day boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  day_key text;
  day_order text[] := array['mon','tue','wed','thu','fri','sat','sun'];
  dow int;
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;
  if not is_staff() and not exists (
    select 1 from public.accountability_group_members agm
    where agm.group_id = p_group_id and agm.user_id = caller and agm.status = 'active'
  ) then
    raise exception 'You are not an active member of that group.';
  end if;

  day_key := p_day_key;
  if day_key is null or not (day_key = any(day_order)) then
    dow := extract(dow from current_date)::int; -- 0=Sun..6=Sat, matches JS getDay()
    day_key := day_order[case when dow = 0 then 7 else dow end];
  end if;

  return query
  select
    u.id,
    u.full_name,
    u.avatar,
    (u.id = caller),
    (select max(c.date) from public.checkins c where c.user_id = u.id),
    (select count(*)::int from public.checkins c where c.user_id = u.id and c.date >= current_date - 6),
    checkin_streak(u.id),
    day_key,
    coalesce(p.data -> day_key, '[]'::jsonb),
    (coalesce(jsonb_array_length(p.data -> day_key), 0) = 0)
  from public.accountability_group_members m
  join public.users u on u.id = m.user_id
  left join public.programs p on p.owner_id = u.id
  where m.group_id = p_group_id
    and m.status = 'active'
  order by u.full_name;
end;
$$;

-- ============================================================
-- Verify:
-- 1. checkin_streak(<some member id with a real check-in history>)
--    returns the same number that member's own Profile page shows.
-- 2. accountability_group_feed(<a group you're active in>) now includes
--    a streak column matching (1) for each member, without changing
--    any of the other existing columns' values.
-- ============================================================
