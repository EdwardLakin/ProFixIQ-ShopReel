create table if not exists public.shopreel_campaign_item_scenes (
  id uuid primary key default gen_random_uuid(),
  campaign_item_id uuid not null references public.shopreel_campaign_items(id) on delete cascade,
  campaign_id uuid not null references public.shopreel_campaigns(id) on delete cascade,
  shop_id uuid not null,
  scene_order integer not null,
  title text not null,
  prompt text not null,
  duration_seconds numeric null,
  media_job_id uuid null references public.shopreel_media_generation_jobs(id) on delete set null,
  output_asset_id uuid null references public.content_assets(id) on delete set null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_item_id, scene_order)
);

create index if not exists idx_shopreel_campaign_item_scenes_campaign_item_id
  on public.shopreel_campaign_item_scenes(campaign_item_id);

create index if not exists idx_shopreel_campaign_item_scenes_campaign_id
  on public.shopreel_campaign_item_scenes(campaign_id);

create index if not exists idx_shopreel_campaign_item_scenes_shop_id
  on public.shopreel_campaign_item_scenes(shop_id);

alter table public.shopreel_campaign_item_scenes enable row level security;

drop policy if exists "shopreel_campaign_item_scenes_select_own_shop" on public.shopreel_campaign_item_scenes;
create policy "shopreel_campaign_item_scenes_select_own_shop"
on public.shopreel_campaign_item_scenes
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_campaign_item_scenes_insert_own_shop" on public.shopreel_campaign_item_scenes;
create policy "shopreel_campaign_item_scenes_insert_own_shop"
on public.shopreel_campaign_item_scenes
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_campaign_item_scenes_update_own_shop" on public.shopreel_campaign_item_scenes;
create policy "shopreel_campaign_item_scenes_update_own_shop"
on public.shopreel_campaign_item_scenes
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());
