-- =====================================================================
-- Voltarc Energy — growth upgrade (wholesale requests, email leads, offer codes)
-- Run ONCE in Supabase Dashboard → SQL Editor, after schema.sql. Safe to re-run.
-- =====================================================================

-- ---------- WHOLESALE / TRADE REQUESTS ----------
create table if not exists public.trade_requests (
  id uuid primary key default gen_random_uuid(),
  company text not null check (char_length(company) between 1 and 200),
  contact_name text not null check (char_length(contact_name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  phone text not null default '' check (char_length(phone) <= 50),
  business_type text not null default '' check (char_length(business_type) <= 100),
  volume text not null default '' check (char_length(volume) <= 50),
  message text not null default '' check (char_length(message) <= 4000),
  status text not null default 'new' check (status in ('new','contacted','quoted','won','lost')),
  created_at timestamptz not null default now()
);
grant insert on public.trade_requests to anon, authenticated;
grant select, update, delete on public.trade_requests to authenticated;
grant all on public.trade_requests to service_role;
alter table public.trade_requests enable row level security;
drop policy if exists "anyone submits trade request" on public.trade_requests;
create policy "anyone submits trade request" on public.trade_requests for insert to anon, authenticated with check (status = 'new');
drop policy if exists "staff manage trade requests" on public.trade_requests;
create policy "staff manage trade requests" on public.trade_requests for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ---------- EMAIL LEADS (handbook download) ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 320),
  source text not null default 'handbook' check (char_length(source) <= 50),
  created_at timestamptz not null default now()
);
grant insert on public.leads to anon, authenticated;
grant select, delete on public.leads to authenticated;
grant all on public.leads to service_role;
alter table public.leads enable row level security;
drop policy if exists "anyone subscribes" on public.leads;
create policy "anyone subscribes" on public.leads for insert to anon, authenticated with check (true);
drop policy if exists "staff read leads" on public.leads;
create policy "staff read leads" on public.leads for select to authenticated using (public.is_staff(auth.uid()));
drop policy if exists "staff delete leads" on public.leads;
create policy "staff delete leads" on public.leads for delete to authenticated using (public.is_staff(auth.uid()));

-- ---------- OFFER CODES used by the storefront ----------
-- BUNDLE10: 10% off kits (shown on product pages). WELCOME50: $50 off orders over $500 (handbook sign-up).
insert into public.coupons (code, type, value, min_subtotal, active) values
  ('BUNDLE10', 'percent', 10, 0, true),
  ('WELCOME50', 'fixed', 50, 500, true)
on conflict (code) do nothing;
