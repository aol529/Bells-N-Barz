-- ============================================================
-- COACHES SEE THEIR OWN CLIENTS, STAGE 3: PRIVATE DATA (ran on live 2026-11-06)
-- Run after 101-front-office-billing.sql. Safe to re-run.
--
-- Coaching and health data: admin, the member's coach, a coach running a
-- confirmed 1-on-1 with them, and a covering coach. Not the front desk.
-- Day-to-day records: front office, plus coaches for members they can see.
-- Coaching-team messages: the same as day-to-day records.
-- Private messages between two people: only those two.
-- Period log: only the member.
--
-- Each policy keeps its wording; only is_staff() inside it is narrowed.
-- The notice output lists every policy changed.
-- To undo: re-run the sql file that first created each policy.
-- ============================================================

-- A covering coach counts as the client's coach until the cover ends.
create or replace function is_meal_plan_staff_for(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin() or exists (
    select 1 from public.users
    where id = p_member_id
    and trainer_id is not null
    and trainer_id = my_user_id()
  ) or exists (
    select 1 from public.coach_cover c
    left join public.users u on u.id = p_member_id
    where c.covering_coach = my_user_id()
      and current_date between c.starts_on and c.ends_on
      and (c.client_id = p_member_id or c.for_coach = u.trainer_id)
  );
$$;

create or replace function narrow_staff_policies(p_table text, p_check text)
returns integer
language plpgsql
as $$
declare
  p record;
  n integer := 0;
  v_qual text;
  v_with text;
  v_sql text;
begin
  for p in select * from pg_policies
           where schemaname = 'public' and tablename = p_table
             and (qual ~ 'is_staff\(\)' or with_check ~ 'is_staff\(\)')
             and coalesce(qual, '') !~ 'can_see_member|is_coach_for' loop
    v_qual := replace(p.qual, 'is_staff()', p_check);
    v_with := replace(p.with_check, 'is_staff()', p_check);
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
    v_sql := format('create policy %I on public.%I for %s', p.policyname, p.tablename, p.cmd);
    if v_qual is not null then v_sql := v_sql || format(' using (%s)', v_qual); end if;
    if v_with is not null then v_sql := v_sql || format(' with check (%s)', v_with); end if;
    execute v_sql;
    n := n + 1;
    raise notice 'narrowed %.%', p.tablename, p.policyname;
  end loop;
  return n;
end;
$$;

do $$
declare t text;
begin
  -- Coaching and health data.
  foreach t in array array['assessments','fasting_log','fasting_settings','weight_log'] loop
    perform narrow_staff_policies(t, 'is_coach_for(user_id)');
  end loop;
  perform narrow_staff_policies('mls_history', 'is_coach_for(member_id)');
  perform narrow_staff_policies('mls_live_store', 'is_coach_for(owner_id)');
  perform narrow_staff_policies('programs', 'is_coach_for(owner_id)');
  perform narrow_staff_policies('hep_progression_store', 'is_coach_for(owner_id)');

  -- Day-to-day records.
  foreach t in array array['checkins','pt_waitlist'] loop
    perform narrow_staff_policies(t, '(is_staff() and can_see_member(user_id))');
  end loop;
  foreach t in array array['member_prefs','member_vehicles','membership_freezes','parking_sessions','checkin_overdue_nudges'] loop
    perform narrow_staff_policies(t, '(is_staff() and can_see_member(member_id))');
  end loop;

  -- Coaching-team messages.
  perform narrow_staff_policies('message_threads', '(is_staff() and can_see_member(member_id))');
  perform narrow_staff_policies('messages',
    '(is_staff() and can_see_member((select t.member_id from public.message_threads t where t.id = thread_id)))');
  perform narrow_staff_policies('message_reactions',
    '(is_staff() and can_see_member((select t.member_id from public.messages m join public.message_threads t on t.id = m.thread_id where m.id = message_id)))');

  -- Private to the member, or to the two people in a conversation: no staff access.
  foreach t in array array['dm_threads','dm_messages','dm_message_reactions','period_log'] loop
    perform narrow_staff_policies(t, 'false');
  end loop;
end $$;

drop function narrow_staff_policies(text, text);
