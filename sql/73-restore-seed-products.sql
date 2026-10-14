-- ============================================================
-- RESTORE SEED PRODUCTS
-- Run after 72-coaching-packages.sql. Safe to re-run.
--
-- Until 72 ran, the products table was empty, so the Shop fell back to
-- the built-in SEED_PRODUCTS list (js/bells-n-barz-shop.js). Once 72
-- added rows, the Shop showed only those and the original eight
-- vanished. This adds them back as real rows so they can be edited in
-- Admin > Shop. Skips any product whose name already exists.
-- Checkout links / file URLs are left empty: set them in Admin > Shop.
-- ============================================================

insert into public.products (type, name, description, price, credits, stock, active)
select v.type, v.name, v.description, v.price, v.credits, v.stock, true
from (values
  ('package',    '10-Session Pack',            '10 one-on-one session credits · never expires',   480, 10,   null),
  ('package',    '5-Session Pack',             '5 one-on-one session credits · never expires',    260, 5,    null),
  ('merch',      'Bell(e)s N'' Barz Tee',      'Heavyweight cotton, gold logo print',             32,  null, 14),
  ('merch',      'Gym Tote Bag',               'Canvas, reinforced straps',                       24,  null, 3),
  ('merch',      'Lifting Straps',             'Cotton, gold-stitched',                           18,  null, 22),
  ('supplement', 'Whey Isolate — Vanilla',     '900g · 30 servings',                              45,  null, 9),
  ('supplement', 'Creatine Monohydrate',       '300g · unflavored',                               22,  null, 2),
  ('digital',    'Off-Season Nutrition Guide', '28-page PDF — fuelling strategy between blocks',  15,  null, null)
) as v(type, name, description, price, credits, stock)
where not exists (select 1 from public.products p where p.name = v.name);
