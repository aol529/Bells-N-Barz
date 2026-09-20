-- ============================================================
-- ACCOUNTABILITY GROUPS
-- Members connect with a friend/friend group to see each other's
-- activity (today's expected workout + check-in stats). Run after
-- gym.sql (needs is_staff()/my_user_id()) and after
-- 05-grant-schema-privileges.sql.
--
-- Two new tables, SELECT-only RLS for authenticated (plus staff
-- full access, matching every other table in gym.sql), and ZERO
-- member-facing INSERT/UPDATE/DELETE policies. Every member write
-- goes through the security-definer RPCs below — same pattern
-- already used by protect_staff_only_user_columns() in
-- 03-fix-users-self-escalation.sql — so state-machine rules
-- (pending -> active only by the invitee, etc.) live in one place
-- in plpgsql instead of fragile self-referencing RLS policies.
-- ============================================================

create table if not exists public.accountability_groups (
  id uuid not null default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  constraint accountability_groups_pkey primary key (id)
);

create table if not exists public.accountability_group_members (
  id uuid not null default gen_random_uuid(),
  group_id uuid not null references public.accountability_groups(id) on delete cascade,
  user_id uuid not null references public.users(id),
  status text not null default 'pending' check (status in ('pending','active','declined','left')),
  invited_by uuid references public.users(id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  constraint accountability_group_members_pkey primary key (id),
  constraint accountability_group_members_unique unique (group_id, user_id)
);

create index if not exists idx_agm_user_id on public.accountability_group_members(user_id);
create index if not exists idx_agm_group_id on public.accountability_group_members(group_id);

alter table public.accountability_groups enable row level security;
alter table public.accountability_group_members enable row level security;

drop policy if exists "members read groups they belong to" on public.accountability_groups;
create policy "members read groups they belong to"
  on public.accountability_groups for select
  using (
    is_staff() or
    exists (
      select 1 from public.accountability_group_members m
      where m.group_id = accountability_groups.id and m.user_id = my_user_id()
    )
  );

drop policy if exists "staff full access accountability_groups" on public.accountability_groups;
create policy "staff full access accountability_groups"
  on public.accountability_groups for all
  using (is_staff());

-- Whether the caller has an ACTIVE row in the given group. Needed as its
-- own security-definer function rather than an inline subquery in the
-- policy below: a policy on accountability_group_members that queries
-- accountability_group_members itself re-triggers the same policy on the
-- inner query, causing "infinite recursion detected in policy for
-- relation accountability_group_members". A security-definer function
-- bypasses RLS on its own internal query (same reason is_staff() and
-- my_user_id() are security-definer), breaking the recursion.
create or replace function is_active_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.accountability_group_members
    where group_id = gid and user_id = my_user_id() and status = 'active'
  );
$$;

-- A caller always sees their OWN membership row (pending or active) in any
-- group, and sees OTHER members' rows in a group only once their own row
-- there is 'active' — a pending invitee sees the group's name (via the
-- groups policy above) but not its roster until they accept.
drop policy if exists "members read their group membership rows" on public.accountability_group_members;
create policy "members read their group membership rows"
  on public.accountability_group_members for select
  using (
    is_staff() or
    user_id = my_user_id() or
    is_active_group_member(group_id)
  );

drop policy if exists "staff full access accountability_group_members" on public.accountability_group_members;
create policy "staff full access accountability_group_members"
  on public.accountability_group_members for all
  using (is_staff());

-- No insert/update/delete policy for plain members on either table —
-- every write goes through a security-definer RPC below.

-- ---------------- RPC: search for someone to connect with ----------------
-- Needed because plain members currently have zero visibility into other
-- members' profiles — the Connect button has nothing to search against
-- without this.

create or replace function accountability_search_members(q text)
returns table (id uuid, full_name text, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.full_name, u.avatar
  from public.users u
  where q is not null
    and length(trim(q)) > 0
    and u.id <> my_user_id()
    and u.status <> 'suspended'
    and u.full_name ilike '%' || q || '%'
  order by u.full_name
  limit 20;
$$;

-- ---------------- RPC: Connect button ----------------
-- p_group_id null  -> first connection: caller names a brand-new group,
--                     becomes its first ACTIVE member, target gets a
--                     PENDING invite.
-- p_group_id given -> caller must already be an ACTIVE member of it;
--                     target gets a PENDING invite into that group
--                     (re-inviting someone who previously left/declined
--                     resets their row back to pending).

create or replace function accountability_connect(
  target_user_id uuid,
  p_group_id uuid default null,
  p_group_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  new_group_id uuid;
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;
  if target_user_id = caller then
    raise exception 'You cannot connect with yourself.';
  end if;
  if not exists (select 1 from public.users where id = target_user_id) then
    raise exception 'That member could not be found.';
  end if;

  if p_group_id is not null then
    if not exists (
      select 1 from public.accountability_group_members
      where group_id = p_group_id and user_id = caller and status = 'active'
    ) then
      raise exception 'You are not an active member of that group.';
    end if;

    insert into public.accountability_group_members (group_id, user_id, status, invited_by)
    values (p_group_id, target_user_id, 'pending', caller)
    on conflict (group_id, user_id) do update
      set status = 'pending', invited_by = excluded.invited_by, joined_at = null
      where public.accountability_group_members.status in ('declined', 'left');

    return p_group_id;
  else
    if p_group_name is null or length(trim(p_group_name)) = 0 then
      raise exception 'Group name is required to start a new group.';
    end if;

    insert into public.accountability_groups (name, created_by)
    values (trim(p_group_name), caller)
    returning id into new_group_id;

    insert into public.accountability_group_members (group_id, user_id, status, invited_by, joined_at)
    values (new_group_id, caller, 'active', caller, now());

    insert into public.accountability_group_members (group_id, user_id, status, invited_by)
    values (new_group_id, target_user_id, 'pending', caller);

    return new_group_id;
  end if;
end;
$$;

-- ---------------- RPC: Accept / Decline an invite ----------------

create or replace function accountability_respond(p_group_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  affected int;
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;

  update public.accountability_group_members
  set status = case when accept then 'active' else 'declined' end,
      joined_at = case when accept then now() else joined_at end
  where group_id = p_group_id and user_id = caller and status = 'pending';

  get diagnostics affected = row_count;
  if affected = 0 then
    raise exception 'No pending invite found for that group.';
  end if;
end;
$$;

-- ---------------- RPC: Leave a group ----------------

create or replace function accountability_leave(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  affected int;
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;

  update public.accountability_group_members
  set status = 'left'
  where group_id = p_group_id and user_id = caller and status = 'active';

  get diagnostics affected = row_count;
  if affected = 0 then
    raise exception 'You are not an active member of that group.';
  end if;
end;
$$;

-- ---------------- RPC: my groups + pending invites ----------------

create or replace function accountability_my_groups()
returns table (
  group_id uuid,
  group_name text,
  my_status text,
  invited_by_name text,
  active_member_count integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id,
    g.name,
    m.status,
    inviter.full_name,
    (select count(*)::int from public.accountability_group_members am
       where am.group_id = g.id and am.status = 'active'),
    m.created_at
  from public.accountability_group_members m
  join public.accountability_groups g on g.id = m.group_id
  left join public.users inviter on inviter.id = m.invited_by
  where m.user_id = my_user_id()
    and m.status in ('pending', 'active')
  order by (m.status = 'pending') desc, g.name;
$$;

-- ---------------- RPC: group feed (today's workout + check-in stats) ----------------
-- p_day_key should be passed from the client using the exact same
-- Mon..Sun key the main file already computes locally (DAY_ORDER +
-- new Date().getDay(), see "bells n barz (main file).html" lines
-- 5340/5956) so "today" means the same thing here as everywhere else
-- in the app. Falls back to a UTC-based computation only if the
-- client omits it.
--
-- Deliberately selects only *today's* slice of programs.data, not the
-- whole jsonb blob, to keep this RPC's exposure to the minimum needed
-- ("what did your coach expect of you today"), not a general-purpose
-- "read anyone's whole program" endpoint.

create or replace function accountability_group_feed(p_group_id uuid, p_day_key text default null)
returns table (
  user_id uuid,
  full_name text,
  avatar text,
  is_me boolean,
  last_checkin date,
  checkins_last_7_days integer,
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
  -- Table columns qualified with an alias here, not just for style — the
  -- `returns table(user_id uuid, ...)` clause above makes "user_id" an
  -- implicit plpgsql variable in this function's scope, so an unqualified
  -- reference to the accountability_group_members.user_id column is
  -- ambiguous and fails with "column reference user_id is ambiguous".
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
-- Verify (as a logged-in plain member):
-- 1. accountability_search_members('a') returns other members, never self.
-- 2. accountability_connect(<friend id>, null, 'Test Group') creates a
--    group, makes caller 'active', gives friend a 'pending' row.
-- 3. As the friend: accountability_respond(<group id>, true) flips them
--    to 'active'; accountability_group_feed(<group id>) then returns
--    both, each with THEIR OWN today's program blocks (not shared/copied).
-- 4. As a third, unrelated member: accountability_group_feed(<group id>)
--    raises "You are not an active member of that group."
-- 5. As staff: accountability_group_feed(<any group id>) succeeds without
--    membership, matching the is_staff() bypass used everywhere else.
-- 6. A plain member directly running
--      insert into accountability_group_members (group_id, user_id, status)
--      values ('<some group>', auth.uid(), 'active');
--    fails — no insert policy exists; only the RPC path works.
-- ============================================================
