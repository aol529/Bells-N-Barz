-- ============================================================
-- COACH COMMENTS ON LOGGED WORKOUTS
-- Run after 114-photo-wall.sql. Safe to re-run.
--
-- A coach (trainer) or admin can leave a short comment on a member's
-- logged session (a row in mls_history). The member sees it under that
-- session (app: Workout > History) and gets a notification with the
-- comment in it, which send-push delivers to the phone like any other.
--
-- Front desk (role staff) can read comments but not write them.
-- A comment goes when its session is deleted. Comments aren't edited:
-- the coach deletes one and writes it again.
-- ============================================================

-- Coaches and admins (not front desk).
create or replace function is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where auth_id = auth.uid()
    and roles && array['admin','trainer']::text[]
  );
$$;
revoke execute on function is_coach() from public, anon;
grant execute on function is_coach() to authenticated;

create table if not exists public.workout_comments (
  id          uuid primary key default gen_random_uuid(),
  history_id  uuid not null references public.mls_history(id) on delete cascade,
  member_id   uuid not null references public.users(id) on delete cascade,
  coach_id    uuid not null default my_user_id() references public.users(id) on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at  timestamptz not null default now()
);
create index if not exists workout_comments_history on public.workout_comments (history_id, created_at);
create index if not exists workout_comments_member on public.workout_comments (member_id, created_at desc);

alter table public.workout_comments enable row level security;

drop policy if exists "read own or staff reads workout comments" on public.workout_comments;
create policy "read own or staff reads workout comments" on public.workout_comments for select to authenticated
  using (member_id = my_user_id() or is_staff());

-- Written as yourself, on a session that really is that member's.
drop policy if exists "coaches write workout comments" on public.workout_comments;
create policy "coaches write workout comments" on public.workout_comments for insert to authenticated
  with check (
    is_coach()
    and coach_id = my_user_id()
    and member_id = (select h.member_id from public.mls_history h where h.id = history_id)
  );

drop policy if exists "writer or admin deletes workout comments" on public.workout_comments;
create policy "writer or admin deletes workout comments" on public.workout_comments for delete to authenticated
  using (coach_id = my_user_id() or is_admin());

-- The member hears about it: "Coach Kevin on your Monday session: …".
create or replace function notify_workout_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach text;
  v_day   text;
  v_body  text;
begin
  select nullif(split_part(btrim(full_name), ' ', 1), '') into v_coach
    from public.users where id = new.coach_id;
  select case lower(coalesce(day, ''))
      when 'mon' then 'Monday' when 'tue' then 'Tuesday' when 'wed' then 'Wednesday'
      when 'thu' then 'Thursday' when 'fri' then 'Friday' when 'sat' then 'Saturday'
      when 'sun' then 'Sunday' else to_char(date_iso, 'FMDay') end
    into v_day
    from public.mls_history where id = new.history_id;
  v_body := btrim(new.body);
  if char_length(v_body) > 140 then v_body := left(v_body, 137) || '…'; end if;
  insert into public.notifications (user_id, type, message, link_tab)
  values (new.member_id, 'workout_comment',
          coalesce('Coach ' || v_coach, 'Your coach') || ' on your ' || coalesce(nullif(btrim(v_day), '') || ' ', '') || 'session: ' || v_body,
          'session');
  return new;
end;
$$;
revoke execute on function notify_workout_comment() from public, anon, authenticated;

drop trigger if exists workout_comment_notify on public.workout_comments;
create trigger workout_comment_notify after insert on public.workout_comments
  for each row execute function notify_workout_comment();

-- ============================================================
-- Check:
--   select count(*) from public.workout_comments;            -- 0 at first
--   select polname from pg_policy where polrelid = 'public.workout_comments'::regclass;  -- 3 rows
-- ============================================================
