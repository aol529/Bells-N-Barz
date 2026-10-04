-- ============================================================
-- COACH RATINGS
-- Clients rate coaches they've actually trained with, across five
-- categories (knowledge, motivation, punctuality, hygiene, attire).
-- The overall score is the plain average of the five — never asked
-- for directly, since a single "overall" star tends to be a gut
-- reaction while the per-category breakdown is more honest.
--
-- One rating per client per coach, editable any time, so it tracks
-- the relationship as it changes rather than piling up duplicates.
--
-- PRIVACY — this table deliberately breaks the "staff = broad access"
-- pattern used everywhere else (is_staff() includes trainers, so
-- following the usual pattern would let every coach read every
-- rating with the client's name attached):
--   * A client reads only their own rows.
--   * Admins read everything, names included, for moderation.
--   * Everyone else — coaches included — only ever sees aggregates
--     and anonymous comments, via the SECURITY DEFINER functions
--     below, and only once a coach has MIN_RATINGS (3) ratings, so a
--     coach with one or two clients can't work out who said what.
-- All writes go through rate_coach() / admin_set_rating_hidden(),
-- never a direct client-side insert/update (same approach as the
-- points ledger in 40-points-system.sql).
-- ============================================================

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where auth_id = auth.uid()
    and roles && array['admin']::text[]
  );
$$;

-- Slots store a naive local date + time (no timezone), but the
-- database clock is UTC, so "has this session happened yet" has to be
-- asked in the gym's own timezone. One place to change it if needed.
-- Also used by the booking functions in 42-pt-booking-rpcs.sql.
create or replace function gym_local_now()
returns timestamp
language sql
stable
as $$
  select (now() at time zone 'Africa/Nairobi');
$$;

create table if not exists public.coach_ratings (
  id uuid not null default gen_random_uuid() primary key,
  coach_id uuid not null references public.users(id),
  client_id uuid not null references public.users(id),
  knowledge   smallint not null check (knowledge   between 1 and 5),
  motivation  smallint not null check (motivation  between 1 and 5),
  punctuality smallint not null check (punctuality between 1 and 5),
  hygiene     smallint not null check (hygiene     between 1 and 5),
  attire      smallint not null check (attire      between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  comment_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coach_ratings_one_per_pair unique (coach_id, client_id),
  constraint coach_ratings_not_self check (coach_id <> client_id)
);

alter table public.coach_ratings enable row level security;

drop policy if exists "clients read own coach_ratings" on public.coach_ratings;
create policy "clients read own coach_ratings"
  on public.coach_ratings for select
  using (client_id = my_user_id());

drop policy if exists "admins read all coach_ratings" on public.coach_ratings;
create policy "admins read all coach_ratings"
  on public.coach_ratings for select
  using (is_admin());

-- Deliberately no insert/update/delete policies — see header.

-- ---------------- ELIGIBILITY ----------------
-- "Has trained with" = at least one confirmed 1-on-1 booking with this
-- coach whose slot date has arrived. Upcoming sessions don't count —
-- you can't rate a session you haven't had yet. The slot's own
-- trainer_id is checked too, not just the booking row's, since members
-- can insert their own pt_bookings rows. slots.status is deliberately
-- NOT checked: members can't update slots under RLS, so a slot a
-- member booked themselves stays 'open' in the database.
create or replace function has_trained_with(p_coach_id uuid, p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pt_bookings p
    join public.slots s on s.id = p.slot_id
    where p.user_id = p_client_id
    and p.trainer_id = p_coach_id
    and s.trainer_id = p_coach_id
    and p.status = 'confirmed'
    and s.date <= gym_local_now()::date
  );
$$;

-- ---------------- WRITE: RATE / RE-RATE ----------------
create or replace function rate_coach(
  p_coach_id uuid,
  p_knowledge smallint,
  p_motivation smallint,
  p_punctuality smallint,
  p_hygiene smallint,
  p_attire smallint,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  clean_comment text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;
  if p_coach_id = caller then
    raise exception 'You cannot rate yourself.';
  end if;
  if not has_trained_with(p_coach_id, caller) then
    raise exception 'You can only rate a coach after a 1-on-1 session with them.';
  end if;

  insert into public.coach_ratings
    (coach_id, client_id, knowledge, motivation, punctuality, hygiene, attire, comment)
  values
    (p_coach_id, caller, p_knowledge, p_motivation, p_punctuality, p_hygiene, p_attire, clean_comment)
  on conflict (coach_id, client_id) do update set
    knowledge   = excluded.knowledge,
    motivation  = excluded.motivation,
    punctuality = excluded.punctuality,
    hygiene     = excluded.hygiene,
    attire      = excluded.attire,
    comment     = excluded.comment,
    -- A hidden comment stays hidden unless the client actually rewrites
    -- it; changing only the stars shouldn't un-hide moderated text.
    comment_hidden = case
      when coach_ratings.comment is distinct from excluded.comment then false
      else coach_ratings.comment_hidden
    end,
    updated_at = now();
end;
$$;

revoke execute on function rate_coach(uuid, smallint, smallint, smallint, smallint, smallint, text) from public;
grant execute on function rate_coach(uuid, smallint, smallint, smallint, smallint, smallint, text) to authenticated;

-- ---------------- WRITE: ADMIN MODERATION ----------------
create or replace function admin_set_rating_hidden(p_rating_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only admins can moderate ratings.';
  end if;
  update public.coach_ratings set comment_hidden = p_hidden where id = p_rating_id;
end;
$$;

revoke execute on function admin_set_rating_hidden(uuid, boolean) from public;
grant execute on function admin_set_rating_hidden(uuid, boolean) to authenticated;

-- ---------------- READ: AGGREGATES (anyone signed in) ----------------
-- One row per active coach. Below 3 ratings only the count comes back
-- (averages are null), so the UI can say "not enough ratings yet".
create or replace function coach_rating_summaries()
returns table (
  coach_id uuid,
  rating_count integer,
  overall numeric,
  knowledge numeric,
  motivation numeric,
  punctuality numeric,
  hygiene numeric,
  attire numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    count(r.id)::integer,
    case when count(r.id) >= 3 then round(avg((r.knowledge + r.motivation + r.punctuality + r.hygiene + r.attire) / 5.0), 1) end,
    case when count(r.id) >= 3 then round(avg(r.knowledge), 1) end,
    case when count(r.id) >= 3 then round(avg(r.motivation), 1) end,
    case when count(r.id) >= 3 then round(avg(r.punctuality), 1) end,
    case when count(r.id) >= 3 then round(avg(r.hygiene), 1) end,
    case when count(r.id) >= 3 then round(avg(r.attire), 1) end
  from public.users u
  left join public.coach_ratings r on r.coach_id = u.id
  where u.status <> 'suspended'
  and u.roles && array['trainer']::text[]
  group by u.id;
$$;

revoke execute on function coach_rating_summaries() from public;
grant execute on function coach_rating_summaries() to authenticated;

-- ---------------- READ: ANONYMOUS COMMENTS (anyone signed in) ----------------
-- No client id or name ever leaves this function. Same 3-rating
-- threshold as the aggregates. Ordered by month only (not exact
-- timestamp) — an exact time could be matched against the coach's own
-- session log to identify the writer.
create or replace function coach_rating_comments(p_coach_id uuid)
returns table (comment text, overall numeric, month date)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.comment,
    round((r.knowledge + r.motivation + r.punctuality + r.hygiene + r.attire) / 5.0, 1),
    date_trunc('month', r.updated_at)::date
  from public.coach_ratings r
  where r.coach_id = p_coach_id
  and r.comment is not null
  and not r.comment_hidden
  and (select count(*) from public.coach_ratings x where x.coach_id = p_coach_id) >= 3
  order by date_trunc('month', r.updated_at) desc, random();
$$;

revoke execute on function coach_rating_comments(uuid) from public;
grant execute on function coach_rating_comments(uuid) to authenticated;

-- ---------------- NUDGE ----------------
-- No real scheduler exists in this app (see checkBirthdaysAndNotify()
-- in the shell), so this runs whenever a member signs in. Drops at
-- most one notification into the caller's own bell per 30 days, and
-- only when there's actually something to rate:
--   * a coach they've trained with but never rated, or
--   * a coach whose rating is 90+ days old and who they've had a
--     session with since.
-- SECURITY DEFINER so it can insert into notifications, which is
-- otherwise staff-insert-only (09-notifications.sql).
create or replace function nudge_coach_ratings()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  due_coach text;
begin
  if caller is null then return; end if;

  if exists (
    select 1 from public.notifications
    where user_id = caller and type = 'coach_rating_nudge'
    and created_at > now() - interval '30 days'
  ) then
    return;
  end if;

  select u.full_name into due_coach
  from public.users u
  left join public.coach_ratings r on r.coach_id = u.id and r.client_id = caller
  where u.id <> caller
  and has_trained_with(u.id, caller)
  and (
    r.id is null
    or (
      r.updated_at < now() - interval '90 days'
      and exists (
        select 1 from public.pt_bookings p
        join public.slots s on s.id = p.slot_id
        where p.user_id = caller and p.trainer_id = u.id
        and s.trainer_id = u.id and p.status = 'confirmed'
        and s.date <= gym_local_now()::date
        and s.date > r.updated_at::date
      )
    )
  )
  limit 1;

  if due_coach is null then return; end if;

  insert into public.notifications (user_id, type, message, link_tab)
  values (
    caller,
    'coach_rating_nudge',
    'How is training with ' || due_coach || ' going? Rate your coach under Booking > Rate Coaches. Your rating stays anonymous.',
    'schedule'
  );
end;
$$;

revoke execute on function nudge_coach_ratings() from public;
grant execute on function nudge_coach_ratings() to authenticated;

-- ============================================================
-- Verify:
-- 1. As a member with a past confirmed 1-on-1 with coach X:
--      select rate_coach('<X>', 5::smallint, 4::smallint, 5::smallint, 5::smallint, 4::smallint, 'Great');
--    succeeds; calling it again updates the same row (no duplicate).
-- 2. As a member with no session with coach Y: rate_coach('<Y>', ...)
--    fails with "You can only rate a coach after a 1-on-1 session".
-- 3. As coach X: select * from coach_ratings → returns nothing.
--    select * from coach_rating_comments('<X>') → anonymous rows only
--    once X has 3+ ratings.
-- 4. As an admin: select * from coach_ratings → every row.
-- ============================================================
