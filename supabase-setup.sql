-- Worth Finding Items: product catalog schema
-- Run this in Supabase Dashboard > SQL Editor.
-- Then create your own admin user in Authentication > Users.
-- IMPORTANT: after creating the user, replace ADMIN_USER_UUID below with that user's UUID,
-- then run the two policy statements marked "ADMIN POLICIES" again.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  description text not null check (char_length(description) between 1 and 2000),
  category text not null default 'Other'
    check (category in ('Home & Living','Kitchen','Gifts','Fashion & Fitness','Outdoor & Camping','Other')),
  image_url text,
  amazon_url text not null,
  keywords text not null default '',
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Public visitors may read only published products.
drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products"
on public.products for select
to anon, authenticated
using (published = true);

-- ADMIN POLICIES:
-- Replace ADMIN_USER_UUID with the UUID from Supabase Authentication > Users.
-- Do not leave the placeholder in place.
drop policy if exists "Admin can read all products" on public.products;
create policy "Admin can read all products"
on public.products for select
to authenticated
using (auth.uid() = 'ffe6ad74-ac14-4473-a376-9b0a8b3da873'::uuid);

drop policy if exists "Admin can insert products" on public.products;
create policy "Admin can insert products"
on public.products for insert
to authenticated
with check (auth.uid() = 'ffe6ad74-ac14-4473-a376-9b0a8b3da873'::uuid);

drop policy if exists "Admin can update products" on public.products;
create policy "Admin can update products"
on public.products for update
to authenticated
using (auth.uid() = 'ffe6ad74-ac14-4473-a376-9b0a8b3da873'::uuid)
with check (auth.uid() = 'ffe6ad74-ac14-4473-a376-9b0a8b3da873'::uuid);

drop policy if exists "Admin can delete products" on public.products;
create policy "Admin can delete products"
on public.products for delete
to authenticated
using (auth.uid() = 'ffe6ad74-ac14-4473-a376-9b0a8b3da873'::uuid);

create index if not exists products_published_created_idx
on public.products (published, created_at desc);

create index if not exists products_category_idx
on public.products (category);
