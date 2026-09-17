-- ============================================================
-- GALLERY — RLS policies for gallery_images, megatron_slides
-- Requires is_staff() from gym.sql — run that first.
-- ============================================================

-- ---------------- GALLERY_IMAGES ----------------
alter table public.gallery_images enable row level security;

drop policy if exists "anyone can read gallery" on public.gallery_images;
create policy "anyone can read gallery"
  on public.gallery_images for select
  using (true);

drop policy if exists "staff manage gallery" on public.gallery_images;
create policy "staff manage gallery"
  on public.gallery_images for insert
  with check (is_staff());

drop policy if exists "staff update gallery" on public.gallery_images;
create policy "staff update gallery"
  on public.gallery_images for update
  using (is_staff());

drop policy if exists "staff delete gallery" on public.gallery_images;
create policy "staff delete gallery"
  on public.gallery_images for delete
  using (is_staff());

-- ---------------- MEGATRON_SLIDES (blog's featured-image carousel) ----------------
alter table public.megatron_slides enable row level security;

drop policy if exists "anyone can read megatron_slides" on public.megatron_slides;
create policy "anyone can read megatron_slides"
  on public.megatron_slides for select
  using (true);

drop policy if exists "staff manage megatron_slides" on public.megatron_slides;
create policy "staff manage megatron_slides"
  on public.megatron_slides for insert
  with check (is_staff());

drop policy if exists "staff update megatron_slides" on public.megatron_slides;
create policy "staff update megatron_slides"
  on public.megatron_slides for update
  using (is_staff());

drop policy if exists "staff delete megatron_slides" on public.megatron_slides;
create policy "staff delete megatron_slides"
  on public.megatron_slides for delete
  using (is_staff());
