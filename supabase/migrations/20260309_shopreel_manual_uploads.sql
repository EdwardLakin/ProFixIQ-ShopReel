begin;

create table if not exists public.shopreel_manual_assets (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  created_by uuid null references auth.users(id) on delete set null,

  title text not null,
  description text null,

  source_type text not null default 'manual_upload',
  asset_type text not null check (asset_type in ('image', 'video', 'mixed')),
  status text not null default 'draft' check (
    status in ('draft', 'uploaded', 'processing', 'ready', 'archived', 'failed')
  ),

  content_goal text null check (
    content_goal in (
      'educational_tip',
      'before_after',
      'repair_story',
      'promotion',
      'customer_trust',
      'team_culture',
      'seasonal_reminder',
      'product_spotlight'
    )
  ),

  note text null,
  platform_targets text[] not null default '{}',
  tags text[] not null default '{}',

  primary_file_url text null,
  thumbnail_url text null,
  duration_seconds numeric(10,2) null,

  metadata_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopreel_manual_asset_files (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  manual_asset_id uuid not null references public.shopreel_manual_assets(id) on delete cascade,

  file_path text not null,
  file_url text null,
  file_name text not null,
  file_type text not null check (file_type in ('image', 'video')),
  mime_type text not null,

  sort_order integer not null default 0,
  width integer null,
  height integer null,
  duration_seconds numeric(10,2) null,
  size_bytes bigint null,

  metadata_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists idx_shopreel_manual_assets_shop_id
  on public.shopreel_manual_assets(shop_id);

create index if not exists idx_shopreel_manual_assets_status
  on public.shopreel_manual_assets(status);

create index if not exists idx_shopreel_manual_assets_created_at
  on public.shopreel_manual_assets(created_at desc);

create index if not exists idx_shopreel_manual_asset_files_asset_id
  on public.shopreel_manual_asset_files(manual_asset_id);

create or replace function public.shopreel_manual_assets_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_shopreel_manual_assets_updated_at on public.shopreel_manual_assets;

create trigger trg_shopreel_manual_assets_updated_at
before update on public.shopreel_manual_assets
for each row
execute function public.shopreel_manual_assets_set_updated_at();

alter table public.shopreel_manual_assets enable row level security;
alter table public.shopreel_manual_asset_files enable row level security;

drop policy if exists shopreel_manual_assets_select_shop on public.shopreel_manual_assets;
create policy shopreel_manual_assets_select_shop
on public.shopreel_manual_assets
for select
to authenticated
using (shop_id = public.current_shop_id());

drop policy if exists shopreel_manual_assets_insert_shop on public.shopreel_manual_assets;
create policy shopreel_manual_assets_insert_shop
on public.shopreel_manual_assets
for insert
to authenticated
with check (shop_id = public.current_shop_id());

drop policy if exists shopreel_manual_assets_update_shop on public.shopreel_manual_assets;
create policy shopreel_manual_assets_update_shop
on public.shopreel_manual_assets
for update
to authenticated
using (shop_id = public.current_shop_id())
with check (shop_id = public.current_shop_id());

drop policy if exists shopreel_manual_assets_delete_shop on public.shopreel_manual_assets;
create policy shopreel_manual_assets_delete_shop
on public.shopreel_manual_assets
for delete
to authenticated
using (shop_id = public.current_shop_id());

drop policy if exists shopreel_manual_asset_files_select_shop on public.shopreel_manual_asset_files;
create policy shopreel_manual_asset_files_select_shop
on public.shopreel_manual_asset_files
for select
to authenticated
using (shop_id = public.current_shop_id());

drop policy if exists shopreel_manual_asset_files_insert_shop on public.shopreel_manual_asset_files;
create policy shopreel_manual_asset_files_insert_shop
on public.shopreel_manual_asset_files
for insert
to authenticated
with check (shop_id = public.current_shop_id());

drop policy if exists shopreel_manual_asset_files_update_shop on public.shopreel_manual_asset_files;
create policy shopreel_manual_asset_files_update_shop
on public.shopreel_manual_asset_files
for update
to authenticated
using (shop_id = public.current_shop_id())
with check (shop_id = public.current_shop_id());

drop policy if exists shopreel_manual_asset_files_delete_shop on public.shopreel_manual_asset_files;
create policy shopreel_manual_asset_files_delete_shop
on public.shopreel_manual_asset_files
for delete
to authenticated
using (shop_id = public.current_shop_id());

insert into storage.buckets (id, name, public)
values ('shopreel-media', 'shopreel-media', false)
on conflict (id) do nothing;

drop policy if exists shopreel_media_select_authenticated on storage.objects;
create policy shopreel_media_select_authenticated
on storage.objects
for select
to authenticated
using (bucket_id = 'shopreel-media');

drop policy if exists shopreel_media_insert_authenticated on storage.objects;
create policy shopreel_media_insert_authenticated
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shopreel-media'
  and split_part(name, '/', 1) = public.current_shop_id()::text
);

drop policy if exists shopreel_media_update_authenticated on storage.objects;
create policy shopreel_media_update_authenticated
on storage.objects
for update
to authenticated
using (
  bucket_id = 'shopreel-media'
  and split_part(name, '/', 1) = public.current_shop_id()::text
)
with check (
  bucket_id = 'shopreel-media'
  and split_part(name, '/', 1) = public.current_shop_id()::text
);

drop policy if exists shopreel_media_delete_authenticated on storage.objects;
create policy shopreel_media_delete_authenticated
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'shopreel-media'
  and split_part(name, '/', 1) = public.current_shop_id()::text
);

commit;
