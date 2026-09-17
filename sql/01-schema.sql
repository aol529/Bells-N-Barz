-- Corrected version of the schema dump — the only real fix needed was
-- replacing the placeholder "ARRAY" type with the actual concrete type
-- (text[]), which was already visible in each column's DEFAULT cast.
-- Everything else is unchanged. Order is already dependency-safe
-- (each table's foreign keys point only to tables defined above it).

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_id uuid,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  roles text[] NOT NULL DEFAULT '{member}'::text[],
  status text NOT NULL DEFAULT 'active'::text,
  avatar text,
  dob date,
  phone text,
  address text,
  height numeric,
  weight numeric,
  experience text,
  goals text,
  injury text,
  ec_name text,
  ec_phone text,
  pref_time text,
  trainer text,
  plan text,
  mstatus text,
  contract_end date,
  balance numeric DEFAULT 0,
  comp text,
  last_checkin date,
  auto_renew boolean DEFAULT false,
  flag text,
  lead_source text,
  internal_notes text,
  credits integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id)
);

CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  issued_date date NOT NULL,
  due_date date,
  notes text,
  voided boolean DEFAULT false,
  status text DEFAULT 'unpaid'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL,
  method text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  credits integer,
  stock integer,
  checkout_url text,
  file_url text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  instructor_id uuid,
  capacity integer,
  duration integer,
  description text,
  recurring text,
  status text DEFAULT 'active'::text,
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id)
);

CREATE TABLE public.class_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  instructor_id uuid,
  capacity_override integer,
  status text DEFAULT 'scheduled'::text,
  CONSTRAINT class_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT class_sessions_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_sessions_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id)
);

CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'confirmed'::text,
  booked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.class_sessions(id),
  CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  duration integer,
  status text DEFAULT 'open'::text,
  CONSTRAINT slots_pkey PRIMARY KEY (id),
  CONSTRAINT slots_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id)
);

CREATE TABLE public.pt_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL,
  trainer_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'confirmed'::text,
  booked_at timestamp with time zone DEFAULT now(),
  notes text,
  CONSTRAINT pt_bookings_pkey PRIMARY KEY (id),
  CONSTRAINT pt_bookings_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.slots(id),
  CONSTRAINT pt_bookings_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id),
  CONSTRAINT pt_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  CONSTRAINT checkins_pkey PRIMARY KEY (id),
  CONSTRAINT checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  type text,
  conductor text,
  parq_cardio boolean DEFAULT false,
  parq_joint boolean DEFAULT false,
  parq_clearance boolean DEFAULT false,
  medical text,
  weight numeric,
  bodyfat numeric,
  resting_hr integer,
  bp text,
  movement text,
  goals text,
  history text,
  occ_activity text,
  sleep numeric,
  stress text,
  nutrition text,
  availability text,
  waiver boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessments_pkey PRIMARY KEY (id),
  CONSTRAINT assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.weight_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  weight numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weight_log_pkey PRIMARY KEY (id),
  CONSTRAINT weight_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.period_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  flow text,
  symptoms text[] DEFAULT '{}'::text[],
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT period_log_pkey PRIMARY KEY (id),
  CONSTRAINT period_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  name text DEFAULT 'Default Program'::text,
  data jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT programs_pkey PRIMARY KEY (id),
  CONSTRAINT programs_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);

CREATE TABLE public.gallery_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  url text NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  category text,
  date date,
  alt text,
  caption text,
  featured boolean DEFAULT false,
  likes integer DEFAULT 0,
  CONSTRAINT gallery_images_pkey PRIMARY KEY (id)
);

CREATE TABLE public.mls_live_store (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mls_live_store_pkey PRIMARY KEY (id),
  CONSTRAINT mls_live_store_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);

CREATE TABLE public.mls_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  date_iso date NOT NULL,
  display_date text,
  day text,
  mode text,
  bw text,
  notes text,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mls_history_pkey PRIMARY KEY (id),
  CONSTRAINT mls_history_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id)
);

CREATE TABLE public.hep_progression_store (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hep_progression_store_pkey PRIMARY KEY (id),
  CONSTRAINT hep_progression_store_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);

CREATE TABLE public.megatron_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  image_id uuid,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT megatron_slides_pkey PRIMARY KEY (id),
  CONSTRAINT megatron_slides_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.gallery_images(id)
);

CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text,
  date date NOT NULL,
  author text,
  views integer DEFAULT 0,
  cover text,
  tags text[] DEFAULT '{}'::text[],
  excerpt text,
  body text,
  status text DEFAULT 'draft'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id)
);
