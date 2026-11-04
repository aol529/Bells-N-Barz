-- ============================================================
-- DELETE MESSAGES FOR YOURSELF
-- Run after 95-scheduled-reminders.sql. Safe to re-run.
--
-- A chat belongs to everyone in it, so deleting a message only takes it
-- out of your own view: the other person keeps their copy, and a member
-- can't wipe a coach's record of a conversation (or the other way round).
-- kind says which table message_id is in:
--   coach = messages, dm = dm_messages, group = chat_group_messages.
-- ============================================================

create table if not exists public.message_hides (
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('coach', 'dm', 'group')),
  message_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, message_id)
);

grant select on public.message_hides to authenticated;
alter table public.message_hides enable row level security;

drop policy if exists "users read own message_hides" on public.message_hides;
create policy "users read own message_hides"
  on public.message_hides for select
  using (user_id = my_user_id());

create or replace function hide_messages(p_kind text, p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := my_user_id();
  v_count integer;
begin
  if caller is null then raise exception 'Not signed in.'; end if;
  if p_kind not in ('coach', 'dm', 'group') then raise exception 'Unknown message type.'; end if;
  if coalesce(array_length(p_ids, 1), 0) > 1000 then raise exception 'Too many messages at once.'; end if;
  insert into message_hides (user_id, kind, message_id)
  select caller, p_kind, id from unnest(coalesce(p_ids, '{}')) as id
  on conflict do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function hide_messages(text, uuid[]) from public, anon;
grant execute on function hide_messages(text, uuid[]) to authenticated;

-- ============================================================
-- Check:
--   select count(*) from message_hides;   -- 0, no error
-- ============================================================
