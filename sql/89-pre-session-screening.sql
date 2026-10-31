-- ============================================================
-- PRE-SESSION SCREENING
-- Run after 45-meal-plans.sql and 49-body-measurements.sql (uses
-- is_admin(), is_coach_for()) and 75-feature-switches.sql.
-- Safe to re-run.
--
-- Me > Screening: before their first 1-on-1 a member fills in a health
-- screening (PAR-Q style yes/no questions, injuries, medication), their
-- goals and training history, lifestyle, an emergency contact, and
-- signs the liability waiver by typing their name. One row per member;
-- they can update it any time (the coach is told, and it goes back to
-- "not reviewed"). The coach reviews it and it pre-fills the coach's
-- Initial Assessment (Users > Assessment).
--
-- PRIVACY: health details. Like body measurements, readable only by
--   * the member themselves,
--   * their coach — assigned trainer, or a trainer they have a
--     confirmed 1-on-1 with (is_coach_for, sql/49), and
--   * admins.
-- Front-desk staff can't see it.
-- ============================================================

create table if not exists public.screenings (
  member_id uuid primary key references public.users(id),
  answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) < 32000),
  -- Worked out from answers by the trigger below, never trusted from the app.
  parq_yes boolean not null default false,
  waiver_name text not null check (char_length(trim(waiver_name)) between 2 and 120),
  waiver_version text not null check (char_length(waiver_version) <= 40),
  signed_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz
);

alter table public.screenings enable row level security;
grant select, insert, update on public.screenings to authenticated;

drop policy if exists "screenings read" on public.screenings;
create policy "screenings read"
  on public.screenings for select
  using (member_id = my_user_id() or is_coach_for(member_id));

drop policy if exists "screenings member insert" on public.screenings;
create policy "screenings member insert"
  on public.screenings for insert
  with check (member_id = my_user_id());

drop policy if exists "screenings member update" on public.screenings;
create policy "screenings member update"
  on public.screenings for update
  using (member_id = my_user_id())
  with check (member_id = my_user_id());

-- No delete policy — a signed waiver is kept.

-- ---------------- SERVER-SIDE FIELDS ----------------
-- parq_yes from the answers; timestamps; a member's save clears the
-- review (their answers changed) and can't set it themselves. A review
-- (review_screening below, flagged with bnb.screening_review) changes
-- only the review stamp.
create or replace function screening_before_write()
returns trigger
language plpgsql
as $$
declare
  v_by uuid;
  v_at timestamptz;
begin
  if tg_op = 'UPDATE' and current_setting('bnb.screening_review', true) = 'on' then
    v_by := new.reviewed_by;
    v_at := new.reviewed_at;
    new := old;
    new.reviewed_by := v_by;
    new.reviewed_at := v_at;
    return new;
  end if;
  new.parq_yes := exists (
    select 1 from jsonb_each_text(new.answers) e
    where e.key like 'parq\_%' and e.value = 'Yes'
  );
  new.updated_at := now();
  new.reviewed_by := null;
  new.reviewed_at := null;
  if tg_op = 'UPDATE' then
    new.submitted_at := old.submitted_at;
    if new.waiver_name is distinct from old.waiver_name
       or new.waiver_version is distinct from old.waiver_version then
      new.signed_at := now();
    else
      new.signed_at := old.signed_at;
    end if;
  else
    new.submitted_at := now();
    new.signed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists screening_before_write on public.screenings;
create trigger screening_before_write before insert or update on public.screenings
  for each row execute function screening_before_write();

-- ---------------- COACH MARKS IT REVIEWED ----------------
-- An RPC rather than an update policy, so a coach can only ever set the
-- review stamp, never touch the member's answers or signature.
create or replace function review_screening(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  if not is_coach_for(p_member_id) then
    raise exception 'Only this member''s coach or an admin can review their screening.';
  end if;
  perform set_config('bnb.screening_review', 'on', true);
  update public.screenings
    set reviewed_by = my_user_id(), reviewed_at = now()
    where member_id = p_member_id;
  get diagnostics v_rows = row_count;
  perform set_config('bnb.screening_review', 'off', true);
  if v_rows = 0 then
    raise exception 'This member hasn''t sent a screening yet.';
  end if;
end;
$$;

revoke execute on function review_screening(uuid) from public, anon;
grant execute on function review_screening(uuid) to authenticated;

-- ---------------- NOTIFICATIONS ----------------
-- Goes to the member's assigned coach and any coach they have an
-- upcoming 1-on-1 with; if there's nobody, to every admin.
create or replace function screening_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_msg text;
begin
  select full_name into v_name from public.users where id = new.member_id;
  v_msg := coalesce(v_name, 'A member') ||
    case when tg_op = 'INSERT' then ' sent their pre-session screening.'
         else ' updated their pre-session screening.' end ||
    case when new.parq_yes then ' Answered yes to a health question — check before training.' else '' end;

  with coaches as (
    select trainer_id as id from public.users where id = new.member_id and trainer_id is not null
    union
    select p.trainer_id from public.pt_bookings p
    join public.slots s on s.id = p.slot_id
    where p.user_id = new.member_id and p.status = 'confirmed'
    and s.date >= (gym_local_now())::date
  ),
  recipients as (
    select r.id from public.users r
    where r.status <> 'suspended' and r.id <> new.member_id
    and (
      r.id in (select id from coaches)
      or (not exists (select 1 from coaches) and r.roles && array['admin']::text[])
    )
  )
  insert into public.notifications (user_id, type, message, link_tab)
  select id, 'screening', v_msg, 'coach' from recipients;
  return new;
end;
$$;

drop trigger if exists screening_notify on public.screenings;
create trigger screening_notify after insert or update of answers, waiver_name on public.screenings
  for each row execute function screening_notify();

-- ---------------- SWITCH ----------------
-- Admin > Switchboard "Pre-session screening". Starts off; turn it on
-- once this file has been run.
insert into public.feature_switches (key, enabled) values ('pre-session-screening', false)
on conflict (key) do nothing;

-- ============================================================
-- Verify:
-- 1. As a member: upsert your own screenings row with answers
--    {"parq_heart":"Yes"} → parq_yes comes back true, your coach (or
--    the admins) get a notification. Another member's row → RLS error.
-- 2. As their coach: select → sees it; review_screening(member) sets
--    reviewed_at. As front-desk staff or an unrelated trainer → sees
--    nothing, and review_screening raises.
-- 3. As the member again: update the answers → reviewed_at is null again.
-- ============================================================
