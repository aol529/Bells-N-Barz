-- ============================================================
-- IN-APP NOTIFICATIONS
-- A bell icon with an unread count, not real push/email — this project
-- has no service worker, VAPID keys, email API, or Edge Functions, so
-- building real push/email would mean standing up new external
-- infrastructure (a bigger, separate project, same category as the
-- payment-gateway integration already deferred). This is the slice
-- achievable with what's already here.
--
-- RLS follows the same pattern as every other table in this schema:
-- staff get broad access, and the two accountability trigger points
-- below insert notifications from inside their own already-existing
-- security-definer RPCs (accountability_connect/accountability_respond),
-- which bypass RLS on their own inserts entirely — same reason those
-- RPCs don't need a broader write policy today. The INSERT policy here
-- only has to cover the one client-side trigger point (Program
-- Builder's saveAdminProgram(), which only staff can reach at all).
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  type text not null,
  message text not null,
  link_tab text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);

alter table public.notifications enable row level security;

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications"
  on public.notifications for select
  using (user_id = my_user_id() or is_staff());

drop policy if exists "staff can insert notifications" on public.notifications;
create policy "staff can insert notifications"
  on public.notifications for insert
  with check (is_staff());

drop policy if exists "users mark own notifications read" on public.notifications;
create policy "users mark own notifications read"
  on public.notifications for update
  using (user_id = my_user_id())
  with check (user_id = my_user_id());

-- ---------------- Notify on invite (accountability_connect) ----------------
-- Return type (uuid) is unchanged, so a plain CREATE OR REPLACE is fine
-- here — unlike accountability_group_feed's earlier column-set change,
-- this doesn't need a DROP FUNCTION first.

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
  caller_name text;
  new_group_id uuid;
  group_name text;
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

  select full_name into caller_name from public.users where id = caller;

  if p_group_id is not null then
    if not exists (
      select 1 from public.accountability_group_members
      where group_id = p_group_id and user_id = caller and status = 'active'
    ) then
      raise exception 'You are not an active member of that group.';
    end if;

    select name into group_name from public.accountability_groups where id = p_group_id;

    insert into public.accountability_group_members (group_id, user_id, status, invited_by)
    values (p_group_id, target_user_id, 'pending', caller)
    on conflict (group_id, user_id) do update
      set status = 'pending', invited_by = excluded.invited_by, joined_at = null
      where public.accountability_group_members.status in ('declined', 'left');

    insert into public.notifications (user_id, type, message, link_tab)
    values (target_user_id, 'accountability_invite', coalesce(caller_name, 'A member') || ' invited you to join ' || group_name || '.', 'accountability');

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

    insert into public.notifications (user_id, type, message, link_tab)
    values (target_user_id, 'accountability_invite', coalesce(caller_name, 'A member') || ' invited you to join ' || trim(p_group_name) || '.', 'accountability');

    return new_group_id;
  end if;
end;
$$;

-- ---------------- Notify the inviter on accept (accountability_respond) ----------------
-- Return type (void) is unchanged, same as above — plain CREATE OR REPLACE.
-- Decline is intentionally NOT notified — an accept is the "good news"
-- worth surfacing; a decline notification is a clean later addition.

create or replace function accountability_respond(p_group_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  affected int;
  inviter_id uuid;
  caller_name text;
  group_name text;
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;

  update public.accountability_group_members
  set status = case when accept then 'active' else 'declined' end,
      joined_at = case when accept then now() else joined_at end
  where group_id = p_group_id and user_id = caller and status = 'pending'
  returning invited_by into inviter_id;

  get diagnostics affected = row_count;
  if affected = 0 then
    raise exception 'No pending invite found for that group.';
  end if;

  if accept and inviter_id is not null then
    select full_name into caller_name from public.users where id = caller;
    select name into group_name from public.accountability_groups where id = p_group_id;
    insert into public.notifications (user_id, type, message, link_tab)
    values (inviter_id, 'accountability_joined', coalesce(caller_name, 'A member') || ' joined ' || group_name || '.', 'accountability');
  end if;
end;
$$;

-- ============================================================
-- Verify:
-- 1. As Member A, connect with Member B (new group) — confirm a row
--    appears in notifications for B with type 'accountability_invite'.
-- 2. As B, accountability_respond(<group>, true) — confirm a row
--    appears for A with type 'accountability_joined'.
-- 3. As a plain (non-staff) member, confirm a direct insert fails:
--      insert into notifications (user_id, type, message)
--      values (auth.uid(), 'test', 'test');
--    (should fail — the INSERT policy requires is_staff()).
-- 4. As that same member, confirm you CAN mark your own existing
--    notification read:
--      update notifications set read = true where user_id = auth.uid();
--    (should succeed for your own rows only).
-- ============================================================
