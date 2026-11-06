-- ============================================================
-- COACHES SEE THEIR OWN CLIENTS, STAGE 1: THE MEMBER LIST (ran on live 2026-11-06)
-- Run after 99-roles-and-orders-lockdown.sql. Safe to re-run.
--
-- Front office (admin or front desk 'staff' role) still sees everyone.
-- A coach with only the trainer role sees and edits:
--   their own clients, anyone they run a 1-on-1 with, anyone they're
--   covering through coach_cover, and their fellow staff's names.
-- Class lists come from session_names(): names only, own classes only.
--
-- Later stages cover billing, health data and messages, which still
-- use is_staff() until then.
--
-- To undo: re-run the users policies in sql/gym.sql and sql/99.
-- ============================================================

create or replace function is_front_office()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.users where auth_id = auth.uid() and roles && array['admin','staff']::text[]);
$$;

-- Temporary access: cover one client, or all of a coach's clients.
create table if not exists public.coach_cover (
  id uuid primary key default gen_random_uuid(),
  covering_coach uuid not null references public.users(id) on delete cascade,
  client_id uuid references public.users(id) on delete cascade,
  for_coach uuid references public.users(id) on delete cascade,
  starts_on date not null default current_date,
  ends_on date not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((client_id is null) <> (for_coach is null)),
  check (ends_on >= starts_on)
);

alter table public.coach_cover enable row level security;

drop policy if exists "front office manage cover" on public.coach_cover;
create policy "front office manage cover"
  on public.coach_cover for all
  to authenticated
  using (is_front_office())
  with check (is_front_office());

drop policy if exists "coaches read their cover" on public.coach_cover;
create policy "coaches read their cover"
  on public.coach_cover for select
  to authenticated
  using (covering_coach = my_user_id());

grant select, insert, update, delete on public.coach_cover to authenticated;

create or replace function can_see_member(p_member uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_member = my_user_id() or is_front_office() or (is_staff() and (
    exists (select 1 from public.users u where u.id = p_member and (u.trainer_id = my_user_id() or u.roles && array['admin','trainer','staff']::text[]))
    or exists (select 1 from public.pt_bookings b where b.user_id = p_member and b.trainer_id = my_user_id())
    or exists (select 1 from public.coach_cover c left join public.users u on u.id = p_member
               where c.covering_coach = my_user_id() and current_date between c.starts_on and c.ends_on
                 and (c.client_id = p_member or c.for_coach = u.trainer_id))
  ));
$$;

-- Who's on a class: names only, for the coach running it and the front office.
create or replace function session_names(p_sessions uuid[])
returns table (session_id uuid, user_id uuid, full_name text, status text)
language sql
stable
security definer
set search_path = public
as $$
  select b.session_id, b.user_id, u.full_name, b.status
  from public.bookings b
  join public.class_sessions s on s.id = b.session_id
  join public.classes c on c.id = s.class_id
  join public.users u on u.id = b.user_id
  where b.session_id = any (p_sessions)
    and (is_front_office() or coalesce(s.instructor_id, c.instructor_id) = my_user_id()
         or (is_staff() and exists (select 1 from public.coach_cover v where v.covering_coach = my_user_id()
             and s.date between v.starts_on and v.ends_on and v.for_coach = coalesce(s.instructor_id, c.instructor_id))));
$$;

revoke all on function session_names(uuid[]) from public, anon;
grant execute on function session_names(uuid[]) to authenticated;
revoke all on function can_see_member(uuid) from public, anon;
grant execute on function can_see_member(uuid) to authenticated;

drop policy if exists "staff can read all users" on public.users;
drop policy if exists "staff read members they can see" on public.users;
create policy "staff read members they can see"
  on public.users for select
  using (is_staff() and can_see_member(id));

drop policy if exists "staff can write all users" on public.users;
drop policy if exists "front office write users" on public.users;
create policy "front office write users"
  on public.users for all
  using (is_front_office())
  with check (is_front_office());

drop policy if exists "coaches update members they can see" on public.users;
create policy "coaches update members they can see"
  on public.users for update
  using (is_staff() and can_see_member(id))
  with check (is_staff() and can_see_member(id));

create or replace function protect_staff_only_user_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only admins decide who is staff. Coaches and front desk keep everything
  -- else they could already do, including credits and balances.
  if not is_admin() and current_setting('bnb.system_write', true) is distinct from 'on' then
    if tg_op = 'UPDATE' and new.roles is distinct from old.roles then
      raise exception 'Only an admin can change roles.';
    end if;
    if tg_op = 'INSERT' and is_staff() then
      new.roles := array['member']::text[];
    end if;
  end if;

  -- Coaches don't assign clients: the member, front desk or an admin does.
  if tg_op = 'UPDATE' and new.trainer_id is distinct from old.trainer_id and old.id is distinct from my_user_id()
     and is_staff() and not is_front_office() and current_setting('bnb.system_write', true) is distinct from 'on' then
    raise exception 'Ask the front desk to change a client''s coach.';
  end if;

  if is_staff() or current_setting('bnb.system_write', true) = 'on' then
    return new;
  end if;

  -- New profile row from a non-staff session (self sign-up): staff-only
  -- columns get sign-up defaults no matter what the client sent.
  if tg_op = 'INSERT' then
    new.roles          := array['member']::text[];
    new.status         := 'active';
    new.balance        := 0;
    new.credits        := 0;
    new.comp           := '';
    new.plan           := '';
    new.mstatus        := 'pending';
    new.contract_end   := null;
    new.flag           := 'green';
    new.internal_notes := '';
    new.auto_renew     := false;
    new.trainer        := '';
    new.trainer_id     := null;
    new.last_checkin   := null;
    new.archived_at    := null;
    return new;
  end if;

  if new.trainer_id is distinct from old.trainer_id then
    if new.trainer_id is not null and not exists (
      select 1 from public.users
      where id = new.trainer_id
      and status <> 'suspended'
      and roles && array['trainer']::text[]
    ) then
      raise exception 'You can only pick an active coach.';
    end if;
  end if;

  if new.roles      is distinct from old.roles      or
     new.status     is distinct from old.status     or
     new.balance    is distinct from old.balance    or
     new.credits    is distinct from old.credits    or
     new.comp       is distinct from old.comp       or
     new.plan       is distinct from old.plan       or
     new.mstatus    is distinct from old.mstatus    or
     new.contract_end   is distinct from old.contract_end   or
     new.flag           is distinct from old.flag           or
     new.internal_notes is distinct from old.internal_notes or
     new.lead_source    is distinct from old.lead_source    or
     new.auto_renew     is distinct from old.auto_renew     or
     new.trainer        is distinct from old.trainer        or
     new.last_checkin   is distinct from old.last_checkin   or
     new.archived_at    is distinct from old.archived_at
  then
    raise exception 'You do not have permission to change that field. Contact your coach/staff.';
  end if;

  return new;
end;
$$;

