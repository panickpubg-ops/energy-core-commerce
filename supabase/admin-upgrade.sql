-- =====================================================================
-- Voltarc Energy — admin upgrade (blog, extra settings, payment method)
-- Run ONCE in Supabase Dashboard → SQL Editor, after schema.sql.
-- Safe to re-run.
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
