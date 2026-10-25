-- ============================================================
-- MEMBERSHIP FREEZE
-- Run after 09-notifications.sql and 54-users-staff-column-trigger.sql.
-- Safe to re-run.
--
-- A member going away (travel, injury) pauses instead of cancelling.
--   - A member asks on My Profile: request_membership_freeze() adds a
--     'requested' row and tells every staff account (notifications).
--   - Staff approve or decline in Admin > Users: decide_membership_freeze().
--     Approving pushes the member's contract_end back by the length of
--     the freeze. Staff can also freeze someone directly:
--     staff_freeze_member().
--   - While a freeze covers today the member's mstatus is 'hold' (the
--     existing "On Hold" status); when it ends they go back to 'active'.
--     There's no scheduler here, so apply_membership_freezes() makes
--     those changes and the staff app calls it when it opens.
-- Rows are only ever written through these functions; RLS lets a member
-- read their own and staff read all.
-- ============================================================

create table if not exists public.membership_freezes (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.users(id) on delete cascade,
  starts_on   date not null,
  ends_on     date not null,
  reason      text not null default '',
  status      text not null default 'requested'
              check (status in ('requested', 'approved', 'declined', 'cancelled', 'ended')),
  decided_by  uuid references public.users(id),
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  constraint membership_freezes_dates check (ends_on >= starts_on)
);
create index if not exists membership_freezes_member_idx on public.membership_freezes (member_id, status);

alter table public.membership_freezes enable row level security;

drop policy if exists "members read own freezes" on public.membership_freezes;
create policy "members read own freezes" on public.membership_freezes for select
  using (member_id = my_user_id());

drop policy if exists "staff read all freezes" on public.membership_freezes;
create policy "staff read all freezes" on public.membership_freezes for select
  using (is_staff());

revoke all on public.membership_freezes from anon;
grant select on public.membership_freezes to authenticated;

-- ---------------- MEMBER: ASK / CANCEL ----------------
create or replace function request_membership_freeze(p_starts date, p_ends date, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := my_user_id();
  v_name text;
  v_id uuid;
begin
  if v_me is null then raise exception 'Sign in first.'; end if;
  if p_starts is null or p_ends is null or p_ends < p_starts then
    raise exception 'Pick a start date and an end date on or after it.';
  end if;
  if p_starts < current_date then raise exception 'A freeze can''t start in the past.'; end if;
  if p_ends - p_starts > 92 then raise exception 'A freeze can be at most three months. Talk to the front desk for longer.'; end if;
  if exists (select 1 from membership_freezes where member_id = v_me and status = 'requested') then
    raise exception 'You already have a freeze request waiting. Cancel it first to ask for different dates.';
  end if;

  insert into membership_freezes (member_id, starts_on, ends_on, reason)
  values (v_me, p_starts, p_ends, coalesce(left(p_reason, 300), ''))
  returning id into v_id;

  select full_name into v_name from users where id = v_me;
  insert into notifications (user_id, type, message, link_tab)
  select u.id, 'freeze_request',
         coalesce(v_name, 'A member') || ' asked to freeze their membership ' ||
           to_char(p_starts, 'DD Mon') || ' – ' || to_char(p_ends, 'DD Mon YYYY') || '.',
         'users'
  from users u
  where u.roles && array['admin','trainer','staff']::text[] and u.status <> 'suspended';

  return v_id;
end;
$$;

create or replace function cancel_membership_freeze(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update membership_freezes set status = 'cancelled'
  where id = p_id and member_id = my_user_id() and status = 'requested';
  if not found then raise exception 'That request can''t be cancelled (already decided?).'; end if;
end;
$$;

-- ---------------- STAFF: APPLY TODAY'S STATE ----------------
-- Freezes that have started put the member On Hold; freezes that are over
-- end, and the member goes back to active unless another freeze covers
-- today. Only touches members who are 'active' or 'hold', so an overdue
-- or cancelled membership isn't changed by a freeze.
create or replace function apply_membership_freezes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_changed integer := 0;
  n integer;
begin
  if not is_staff() then raise exception 'Staff only.'; end if;

  update membership_freezes set status = 'ended'
  where status = 'approved' and ends_on < current_date;

  update users u set mstatus = 'hold'
  where u.mstatus = 'active' and exists (
    select 1 from membership_freezes f
    where f.member_id = u.id and f.status = 'approved'
      and current_date between f.starts_on and f.ends_on);
  get diagnostics n = row_count; v_changed := v_changed + n;

  update users u set mstatus = 'active'
  where u.mstatus = 'hold'
    and exists (select 1 from membership_freezes f where f.member_id = u.id and f.status = 'ended')
    and not exists (
      select 1 from membership_freezes f
      where f.member_id = u.id and f.status = 'approved'
        and current_date between f.starts_on and f.ends_on);
  get diagnostics n = row_count; v_changed := v_changed + n;

  return v_changed;
end;
$$;

-- ---------------- STAFF: DECIDE / FREEZE DIRECTLY ----------------
create or replace function decide_membership_freeze(p_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  f membership_freezes%rowtype;
begin
  if not is_staff() then raise exception 'Staff only.'; end if;
  select * into f from membership_freezes where id = p_id for update;
  if not found or f.status <> 'requested' then raise exception 'That request has already been dealt with.'; end if;

  update membership_freezes
  set status = case when p_approve then 'approved' else 'declined' end,
      decided_by = my_user_id(), decided_at = now()
  where id = p_id;

  if p_approve then
    update users set contract_end = contract_end + (f.ends_on - f.starts_on + 1)
    where id = f.member_id and contract_end is not null;
  end if;

  insert into notifications (user_id, type, message, link_tab)
  values (f.member_id, 'freeze_decision',
    case when p_approve
      then 'Your membership freeze ' || to_char(f.starts_on, 'DD Mon') || ' – ' || to_char(f.ends_on, 'DD Mon YYYY') || ' is approved. Your membership end date moves back to match.'
      else 'Your membership freeze request for ' || to_char(f.starts_on, 'DD Mon') || ' – ' || to_char(f.ends_on, 'DD Mon YYYY') || ' was declined. Message us if you''d like to talk it through.'
    end, 'profile');

  perform apply_membership_freezes();
end;
$$;

create or replace function staff_freeze_member(p_member uuid, p_starts date, p_ends date, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not is_staff() then raise exception 'Staff only.'; end if;
  if p_starts is null or p_ends is null or p_ends < p_starts then
    raise exception 'Pick a start date and an end date on or after it.';
  end if;
  insert into membership_freezes (member_id, starts_on, ends_on, reason, status, decided_by, decided_at)
  values (p_member, p_starts, p_ends, coalesce(left(p_reason, 300), ''), 'approved', my_user_id(), now())
  returning id into v_id;

  update users set contract_end = contract_end + (p_ends - p_starts + 1)
  where id = p_member and contract_end is not null;

  insert into notifications (user_id, type, message, link_tab)
  values (p_member, 'freeze_decision',
    'Your membership is frozen ' || to_char(p_starts, 'DD Mon') || ' – ' || to_char(p_ends, 'DD Mon YYYY') || '. Your membership end date moves back to match.',
    'profile');

  perform apply_membership_freezes();
  return v_id;
end;
$$;

-- Ending a freeze early (the member is back sooner): the end date becomes
-- yesterday, the unused days come off contract_end again.
create or replace function end_membership_freeze(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  f membership_freezes%rowtype;
  v_new_end date;
begin
  if not is_staff() then raise exception 'Staff only.'; end if;
  select * into f from membership_freezes where id = p_id for update;
  if not found or f.status <> 'approved' then raise exception 'Only an approved freeze can be ended.'; end if;

  if f.starts_on > current_date then
    -- Hasn't started: drop it entirely.
    update membership_freezes set status = 'cancelled' where id = p_id;
    update users set contract_end = contract_end - (f.ends_on - f.starts_on + 1)
    where id = f.member_id and contract_end is not null;
  else
    v_new_end := greatest(f.starts_on, current_date - 1);
    update membership_freezes set ends_on = v_new_end, status = 'ended' where id = p_id;
    update users set contract_end = contract_end - (f.ends_on - v_new_end)
    where id = f.member_id and contract_end is not null;
  end if;

  perform apply_membership_freezes();
end;
$$;

revoke all on function request_membership_freeze(date, date, text) from public, anon;
revoke all on function cancel_membership_freeze(uuid) from public, anon;
revoke all on function apply_membership_freezes() from public, anon;
revoke all on function decide_membership_freeze(uuid, boolean) from public, anon;
revoke all on function staff_freeze_member(uuid, date, date, text) from public, anon;
revoke all on function end_membership_freeze(uuid) from public, anon;
grant execute on function request_membership_freeze(date, date, text) to authenticated;
grant execute on function cancel_membership_freeze(uuid) to authenticated;
grant execute on function apply_membership_freezes() to authenticated;
grant execute on function decide_membership_freeze(uuid, boolean) to authenticated;
grant execute on function staff_freeze_member(uuid, date, date, text) to authenticated;
grant execute on function end_membership_freeze(uuid) to authenticated;
