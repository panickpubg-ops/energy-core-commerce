-- =====================================================================
-- Voltarc Energy — store schema (catalog, customers, orders, inventory)
-- Run once in Supabase Dashboard → SQL Editor. Safe on a fresh project.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type public.app_role as enum ('admin', 'staff', 'customer');
create type public.chemistry as enum ('LiFePO4', 'NMC', 'Li-ion', 'LTO', 'N/A');
create type public.order_status as enum ('pending','paid','processing','shipped','delivered','cancelled','refunded');
create type public.payment_status as enum ('unpaid','paid','refunded','failed');
create type public.coupon_type as enum ('percent','fixed');
create type public.inventory_reason as enum ('restock','sale','adjustment','return','cancellation');

-- ---------- Shared helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- =====================================================================
-- CUSTOMERS
-- =====================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','staff'))
$$;

create policy "own profile read"   on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own roles read"     on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, line1 text not null, line2 text,
  city text not null, region text not null, postal text not null, country text not null default 'US',
  phone text, is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "own addresses" on public.addresses for all to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid())) with check (user_id = auth.uid());

-- New sign-up → profile + customer role
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- CATALOG
-- =====================================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  tagline text,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at numeric(10,2) check (compare_at >= 0),
  cost numeric(10,2),
  -- battery attributes
  voltage numeric(6,2),
  capacity_ah numeric(8,2),
  energy_wh numeric(10,2),
  chemistry public.chemistry not null default 'N/A',
  cycle_life integer,
  dimensions text,
  weight_kg numeric(8,2),
  warranty_years integer not null default 1,
  specs jsonb not null default '[]'::jsonb,       -- [{label, value}]
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products (category_id);
create index on public.products (published, featured);
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort integer not null default 0
);
create index on public.product_images (product_id, sort);

grant select on public.categories, public.products, public.product_images to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images to authenticated;
grant all on public.categories, public.products, public.product_images to service_role;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

create policy "public categories" on public.categories for select to anon, authenticated using (true);
create policy "staff categories"  on public.categories for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "public published products" on public.products for select to anon, authenticated using (published or public.is_staff(auth.uid()));
create policy "staff products" on public.products for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "public product images" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or public.is_staff(auth.uid()))));
create policy "staff product images" on public.product_images for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- =====================================================================
-- INVENTORY
-- =====================================================================
create table public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  stock integer not null default 0 check (stock >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  low_stock_threshold integer not null default 10,
  updated_at timestamptz not null default now()
);
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  delta integer not null,
  reason public.inventory_reason not null,
  order_id uuid,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on public.inventory_movements (product_id, created_at desc);

grant select on public.inventory to anon, authenticated;
grant insert, update on public.inventory to authenticated;
grant select, insert on public.inventory_movements to authenticated;
grant all on public.inventory, public.inventory_movements to service_role;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
create policy "public stock levels" on public.inventory for select to anon, authenticated using (true);
create policy "staff inventory" on public.inventory for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff movements" on public.inventory_movements for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- every product gets an inventory row
create or replace function public.create_inventory_row() returns trigger
language plpgsql security definer set search_path = public as $$
begin insert into public.inventory (product_id) values (new.id) on conflict do nothing; return new; end $$;
create trigger product_inventory after insert on public.products for each row execute function public.create_inventory_row();

-- movements adjust stock atomically
create or replace function public.apply_inventory_movement() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.inventory set stock = stock + new.delta, updated_at = now() where product_id = new.product_id;
  return new;
end $$;
create trigger inventory_movement_apply after insert on public.inventory_movements for each row execute function public.apply_inventory_movement();

-- =====================================================================
-- COUPONS
-- =====================================================================
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type public.coupon_type not null,
  value numeric(10,2) not null check (value > 0),
  min_subtotal numeric(10,2) not null default 0,
  usage_limit integer,
  used integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "staff coupons" on public.coupons for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
-- customers validate codes through this function only (no listing of all codes)
create or replace function public.validate_coupon(_code text, _subtotal numeric)
returns table (code text, type public.coupon_type, value numeric)
language sql stable security definer set search_path = public as $$
  select c.code, c.type, c.value from public.coupons c
  where upper(c.code) = upper(_code) and c.active
    and (c.expires_at is null or c.expires_at > now())
    and (c.usage_limit is null or c.used < c.usage_limit)
    and _subtotal >= c.min_subtotal
$$;
grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;

-- =====================================================================
-- ORDERS
-- =====================================================================
create sequence public.order_number_seq start 10500;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('VA-' || nextval('public.order_number_seq')),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  payment_method text,
  payment_reference text,
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  coupon_code text,
  shipping_address jsonb not null,
  carrier text,
  tracking_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders (user_id, created_at desc);
create index on public.orders (status);
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  sku text not null,
  image_url text,
  unit_price numeric(10,2) not null,
  qty integer not null check (qty > 0)
);
create index on public.order_items (order_id);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);

grant select on public.orders, public.order_items, public.order_events to authenticated;
grant update on public.orders to authenticated;
grant insert on public.order_events to authenticated;
grant all on public.orders, public.order_items, public.order_events to service_role;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

create policy "own or staff orders read" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "staff orders update" on public.orders for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "own or staff items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff(auth.uid()))));
create policy "own or staff events" on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff(auth.uid()))));
create policy "staff events insert" on public.order_events for insert to authenticated with check (public.is_staff(auth.uid()));

-- log every status change
create or replace function public.log_order_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_events (order_id, status) values (new.id, new.status);
  end if;
  return new;
end $$;
create trigger order_status_log after insert or update of status on public.orders for each row execute function public.log_order_status();

-- Place an order atomically: prices from DB, stock checked & decremented, coupon applied.
-- _items: [{"product_id": "...", "qty": 2}]
create or replace function public.place_order(_email text, _items jsonb, _address jsonb, _coupon text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  o public.orders; it jsonb; p record; sub numeric := 0; disc numeric := 0; ship numeric; taxv numeric; c record;
  s jsonb := (select value from public.store_settings where key = 'store');
begin
  if jsonb_array_length(_items) = 0 then raise exception 'Cart is empty'; end if;
  for it in select * from jsonb_array_elements(_items) loop
    select pr.id, pr.price, i.stock into p from public.products pr join public.inventory i on i.product_id = pr.id
      where pr.id = (it->>'product_id')::uuid and pr.published for update of i;
    if p.id is null then raise exception 'Product unavailable'; end if;
    if p.stock < (it->>'qty')::int then raise exception 'Insufficient stock'; end if;
    sub := sub + p.price * (it->>'qty')::int;
  end loop;
  if _coupon is not null then
    select * into c from public.validate_coupon(_coupon, sub);
    if c.code is not null then disc := case when c.type = 'percent' then round(sub * c.value / 100, 2) else least(c.value, sub) end;
      update public.coupons set used = used + 1 where code = c.code; end if;
  end if;
  ship := case when sub - disc >= coalesce((s->>'free_shipping_threshold')::numeric, 250) then 0 else coalesce((s->>'flat_shipping')::numeric, 15) end;
  taxv := round((sub - disc) * coalesce((s->>'tax_rate')::numeric, 0) / 100, 2);
  insert into public.orders (user_id, email, subtotal, discount, shipping, tax, total, coupon_code, shipping_address)
    values (auth.uid(), _email, sub, disc, ship, taxv, sub - disc + ship + taxv, c.code, _address) returning * into o;
  for it in select * from jsonb_array_elements(_items) loop
    insert into public.order_items (order_id, product_id, name, sku, image_url, unit_price, qty)
      select o.id, pr.id, pr.name, pr.sku,
        (select url from public.product_images pi where pi.product_id = pr.id order by sort limit 1),
        pr.price, (it->>'qty')::int
      from public.products pr where pr.id = (it->>'product_id')::uuid;
    insert into public.inventory_movements (product_id, delta, reason, order_id)
      values ((it->>'product_id')::uuid, -(it->>'qty')::int, 'sale', o.id);
  end loop;
  return o;
end $$;
grant execute on function public.place_order(text, jsonb, jsonb, text) to anon, authenticated;

-- Guest order tracking by number + email
create or replace function public.track_order(_number text, _email text)
returns table (number text, status public.order_status, total numeric, carrier text, tracking_number text, created_at timestamptz, events jsonb)
language sql stable security definer set search_path = public as $$
  select o.number, o.status, o.total, o.carrier, o.tracking_number, o.created_at,
    coalesce((select jsonb_agg(jsonb_build_object('status', e.status, 'at', e.created_at) order by e.created_at) from public.order_events e where e.order_id = o.id), '[]')
  from public.orders o where o.number = _number and lower(o.email) = lower(_email)
$$;
grant execute on function public.track_order(text, text) to anon, authenticated;

-- =====================================================================
-- REVIEWS & WISHLIST
-- =====================================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author text not null,
  rating smallint not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "approved reviews public" on public.reviews for select to anon, authenticated using (approved or user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "customers write own review" on public.reviews for insert to authenticated with check (user_id = auth.uid() and approved = false);
create policy "staff moderate reviews" on public.reviews for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff delete reviews" on public.reviews for delete to authenticated using (public.is_staff(auth.uid()));

create table public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
grant select, insert, delete on public.wishlist_items to authenticated;
grant all on public.wishlist_items to service_role;
alter table public.wishlist_items enable row level security;
create policy "own wishlist" on public.wishlist_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- STORE SETTINGS & HOMEPAGE CONTENT
-- =====================================================================
create table public.store_settings (
  key text primary key,          -- 'store', 'home'
  value jsonb not null,
  updated_at timestamptz not null default now()
);
grant select on public.store_settings to anon, authenticated;
grant insert, update on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;
create policy "public settings" on public.store_settings for select to anon, authenticated using (true);
create policy "admin settings" on public.store_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.store_settings (key, value) values
  ('store', '{"store_name":"Voltarc Energy","support_email":"support@voltarc.dev","support_phone":"+1 (800) 555-0199","currency":"USD","tax_rate":8,"free_shipping_threshold":250,"flat_shipping":15}'),
  ('home',  '{"hero_eyebrow":"LiFePO4 · 6,000+ cycles · 10-year warranty","hero_title":"Energy you can engineer around.","hero_subtitle":"Grade-A lithium batteries, power stations and BMS systems.","hero_cta":"Shop batteries","announcement":"Free shipping on orders over $250"}');

-- =====================================================================
-- STORAGE: product images bucket (public read, staff write)
-- =====================================================================
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;
create policy "public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "staff upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_staff(auth.uid()));
create policy "staff update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_staff(auth.uid()));
create policy "staff delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_staff(auth.uid()));

-- =====================================================================
-- SEED CATEGORIES
-- =====================================================================
insert into public.categories (slug, name, description, sort) values
  ('lifepo4','LiFePO4 Batteries','Deep-cycle lithium iron phosphate for RV, marine, off-grid and solar.',1),
  ('battery-packs','Battery Packs','Custom and modular packs for e-mobility and industrial use.',2),
  ('power-stations','Power Stations','Portable all-in-one energy for home backup and the outdoors.',3),
  ('chargers','Chargers','Smart multi-stage chargers tuned for lithium chemistries.',4),
  ('bms','BMS Systems','Battery management boards with balancing and telemetry.',5),
  ('accessories','Accessories','Busbars, cables, monitors, enclosures and mounting hardware.',6);

-- =====================================================================
-- MAKE YOURSELF ADMIN (after signing up in the store):
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@yourdomain.com';
-- =====================================================================


-- ---------- BLOG ----------
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  cover_url text,
  tags text[] not null default '{}',
  author text not null default '',
  seo_title text,
  seo_description text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_published_idx on public.blog_posts (published, published_at desc);
drop trigger if exists blog_posts_updated on public.blog_posts;
create trigger blog_posts_updated before update on public.blog_posts for each row execute function public.set_updated_at();

grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;
alter table public.blog_posts enable row level security;

drop policy if exists "public published posts" on public.blog_posts;
create policy "public published posts" on public.blog_posts for select to anon, authenticated
  using (published or public.is_staff(auth.uid()));
drop policy if exists "staff manage posts" on public.blog_posts;
create policy "staff manage posts" on public.blog_posts for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ---------- EXTRA SETTINGS (brand, payments, seo) ----------
-- Only non-secret values belong here: this table is publicly readable.
insert into public.store_settings (key, value) values
  ('brand',    '{"logo_url":"","tagline":"Lithium energy, engineered.","address":"","hours":"Mon–Fri, 9am–6pm"}'),
  ('payments', '{"test_mode":true,"methods":{"card":true,"bank_transfer":false,"cod":false,"invoice":false},"bank_instructions":"","invoice_terms":"Net 30 for approved business accounts."}'),
  ('seo',      '{"title_suffix":"Voltarc Energy","default_description":"Premium LiFePO4 batteries, power stations, BMS systems and chargers.","og_image":"","ga4_id":"","gtm_id":"","meta_pixel_id":"","allow_indexing":true}')
on conflict (key) do nothing;

-- staff (not only admins) may need to read; writes stay admin-only via existing policy.

-- ---------- PAYMENT METHOD AT CHECKOUT ----------
create or replace function public.place_order_v2(_email text, _items jsonb, _address jsonb, _coupon text default null, _payment_method text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  methods jsonb := coalesce((select value->'methods' from public.store_settings where key = 'payments'), '{"card":true}'::jsonb);
begin
  if _payment_method is not null and coalesce((methods->>_payment_method)::boolean, false) = false then
    raise exception 'Payment method not available';
  end if;
  o := public.place_order(_email, _items, _address, _coupon);
  update public.orders set payment_method = _payment_method where id = o.id returning * into o;
  return o;
end $$;
grant execute on function public.place_order_v2(text, jsonb, jsonb, text, text) to anon, authenticated;
