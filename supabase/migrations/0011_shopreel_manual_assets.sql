create extension if not exists pgcrypto;

create table if not exists public.shopreel_manual_assets (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  created_by uuid null,
  title text null,
  description text null,
  content_goal text null,
  note text null,
  asset_type text not null default 'mixed',
  status text not null default 'draft'
    check (status in ('draft', 'uploading', 'uploaded', 'processing', 'ready', 'failed')),
  primary_file_url text null,
  duration_seconds numeric null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopreel_manual_assets_shop_id
  on public.shopreel_manual_assets (shop_id);

create table if not exists public.shopreel_manual_asset_files (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.shopreel_manual_assets(id) on delete cascade,
  shop_id uuid not null,
  bucket text not null,
  storage_path text not null,
  public_url text null,
  file_name text null,
  mime_type text null,
  file_size_bytes bigint null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopreel_manual_asset_files_asset_id
  on public.shopreel_manual_asset_files (asset_id);

create index if not exists idx_shopreel_manual_asset_files_shop_id
  on public.shopreel_manual_asset_files (shop_id);

create or replace function public.set_updated_at_manual_assets()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists trg_shopreel_manual_assets_updated_at on public.shopreel_manual_assets;
create trigger trg_shopreel_manual_assets_updated_at
before update on public.shopreel_manual_assets
for each row execute function public.set_updated_at_manual_assets();

drop trigger if exists trg_shopreel_manual_asset_files_updated_at on public.shopreel_manual_asset_files;
create trigger trg_shopreel_manual_asset_files_updated_at
before update on public.shopreel_manual_asset_files
for each row execute function public.set_updated_at_manual_assets();

alter table public.shopreel_manual_assets enable row level security;
alter table public.shopreel_manual_asset_files enable row level security;

drop policy if exists shopreel_manual_assets_all on public.shopreel_manual_assets;
create policy shopreel_manual_assets_all
on public.shopreel_manual_assets
for all
using (shop_id::text = auth.jwt() ->> 'shop_id')
with check (shop_id::text = auth.jwt() ->> 'shop_id');

drop policy if exists shopreel_manual_asset_files_all on public.shopreel_manual_asset_files;
create policy shopreel_manual_asset_files_all
on public.shopreel_manual_asset_files
for all
using (shop_id::text = auth.jwt() ->> 'shop_id')
with check (shop_id::text = auth.jwt() ->> 'shop_id');
