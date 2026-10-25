-- ============================================================
-- LEADERBOARD & CHALLENGES
-- Run after 40-points-system.sql. Safe to re-run.
--
-- Member > Leaderboard: this month's most check-ins, most logged
-- sessions and most points earned, plus challenges staff set up ("Most
-- check-ins in November", "20 sessions this month").
--
-- Members can't read each other's check-ins (RLS), so the board comes
-- from leaderboard(), a SECURITY DEFINER function that returns only a
-- first name + last initial and a count — never ids of other members,
-- emails or dates. Staff and members who opt out (member_prefs) are left
-- off; a member always sees their own row.
-- ============================================================

-- ---------------- PREFERENCES ----------------
create table if not exists public.member_prefs (
  member_id             uuid primary key references public.users(id) on delete cascade,
  hide_from_leaderboard boolean not null default false,
  updated_at            timestamptz not null default now()
);
alter table public.member_prefs enable row level security;

drop policy if exists "members manage own prefs" on public.member_prefs;
create policy "members manage own prefs" on public.member_prefs for all
  using (member_id = my_user_id())
  with check (member_id = my_user_id());

drop policy if exists "staff read prefs" on public.member_prefs;
create policy "staff read prefs" on public.member_prefs for select
  using (is_staff());

revoke all on public.member_prefs from anon;
grant select, insert, update, delete on public.member_prefs to authenticated;

-- ---------------- CHALLENGES ----------------
create table if not exists public.challenges (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  metric      text not null default 'checkins' check (metric in ('checkins', 'sessions', 'points')),
  target      integer check (target is null or target > 0),
  starts_on   date not null,
  ends_on     date not null,
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now(),
  constraint challenges_dates check (ends_on >= starts_on)
);
alter table public.challenges enable row level security;

drop policy if exists "signed-in read challenges" on public.challenges;
create policy "signed-in read challenges" on public.challenges for select
  to authenticated using (true);

drop policy if exists "staff write challenges" on public.challenges;
create policy "staff write challenges" on public.challenges for all
  using (is_staff())
  with check (is_staff());

revoke all on public.challenges from anon;
grant select, insert, update, delete on public.challenges to authenticated;

-- ---------------- THE BOARD ----------------
-- metric: 'checkins' (days checked in), 'sessions' (days with a saved
-- Live Session log), 'points' (points earned, not spent).
-- Returns the top p_limit by rank, plus the caller's own row wherever
-- they are. is_me marks it; no other member's id is returned.
drop function if exists leaderboard(date, date, text, integer);
create or replace function leaderboard(p_from date, p_to date, p_metric text default 'checkins', p_limit integer default 20)
returns table (place integer, display_name text, total integer, is_me boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := my_user_id();
begin
  if v_me is null then raise exception 'Sign in to see the leaderboard.'; end if;
  if p_metric not in ('checkins', 'sessions', 'points') then raise exception 'Unknown leaderboard.'; end if;

  return query
  with people as (
    select u.id, u.full_name
    from users u
    where u.roles && array['member']::text[]
      and not (u.roles && array['admin','trainer','staff']::text[])
      and u.status <> 'suspended'
      and (u.id = v_me or not coalesce((select p.hide_from_leaderboard from member_prefs p where p.member_id = u.id), false))
  ),
  counts as (
    select pe.id, pe.full_name,
      case p_metric
        when 'checkins' then (select count(*) from checkins c where c.user_id = pe.id and c.date between p_from and p_to)
        when 'sessions' then (select count(distinct h.date_iso) from mls_history h where h.member_id = pe.id and h.date_iso between p_from and p_to)
        else (select coalesce(sum(l.delta), 0) from points_ledger l
              where l.user_id = pe.id and l.delta > 0 and l.created_at::date between p_from and p_to)
      end::integer as n
    from people pe
  ),
  ranked as (
    select rank() over (order by n desc)::integer as rnk, c.*
    from counts c
    where c.n > 0
  )
  select r.rnk,
         split_part(trim(r.full_name), ' ', 1) ||
           coalesce(' ' || left(nullif(split_part(trim(r.full_name), ' ', 2), ''), 1) || '.', ''),
         r.n,
         r.id = v_me
  from ranked r
  where r.rnk <= greatest(1, least(p_limit, 100)) or r.id = v_me
  order by r.rnk, r.full_name;
end;
$$;

revoke all on function leaderboard(date, date, text, integer) from public, anon;
grant execute on function leaderboard(date, date, text, integer) to authenticated;
