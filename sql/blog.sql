-- ============================================================
-- BLOG — RLS policies for blog_posts
-- Requires is_staff() from gym.sql — run that first.
-- ============================================================

alter table public.blog_posts enable row level security;

drop policy if exists "anyone can read published blog_posts" on public.blog_posts;
create policy "anyone can read published blog_posts"
  on public.blog_posts for select
  using (status = 'published' or is_staff());

drop policy if exists "staff manage blog_posts" on public.blog_posts;
create policy "staff manage blog_posts"
  on public.blog_posts for insert
  with check (is_staff());

drop policy if exists "staff update blog_posts" on public.blog_posts;
create policy "staff update blog_posts"
  on public.blog_posts for update
  using (is_staff());

drop policy if exists "staff delete blog_posts" on public.blog_posts;
create policy "staff delete blog_posts"
  on public.blog_posts for delete
  using (is_staff());
