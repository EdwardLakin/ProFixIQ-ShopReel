create table if not exists public.shopreel_campaigns (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  created_by uuid null,
  title text not null,
  core_idea text not null,
  audience text null,
  offer text null,
  campaign_goal text null,
  platform_focus text[] not null default '{}',
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopreel_campaign_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shopreel_campaigns(id) on delete cascade,
  shop_id uuid not null,
  sort_order integer not null default 0,
  angle text not null,
  title text not null,
  prompt text not null,
  negative_prompt text null,
  style text null,
  visual_mode text null,
  aspect_ratio text not null default '9:16',
  duration_seconds numeric null,
  status text not null default 'draft',
  media_job_id uuid null references public.shopreel_media_generation_jobs(id) on delete set null,
  content_piece_id uuid null references public.content_pieces(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopreel_campaigns_shop_id
  on public.shopreel_campaigns(shop_id);

create index if not exists idx_shopreel_campaign_items_campaign_id
  on public.shopreel_campaign_items(campaign_id);

create index if not exists idx_shopreel_campaign_items_shop_id
  on public.shopreel_campaign_items(shop_id);

alter table public.shopreel_campaigns enable row level security;
alter table public.shopreel_campaign_items enable row level security;

drop policy if exists "shopreel_campaigns_select_own_shop" on public.shopreel_campaigns;
create policy "shopreel_campaigns_select_own_shop"
on public.shopreel_campaigns
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_campaigns_insert_own_shop" on public.shopreel_campaigns;
create policy "shopreel_campaigns_insert_own_shop"
on public.shopreel_campaigns
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_campaigns_update_own_shop" on public.shopreel_campaigns;
create policy "shopreel_campaigns_update_own_shop"
on public.shopreel_campaigns
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_campaign_items_select_own_shop" on public.shopreel_campaign_items;
create policy "shopreel_campaign_items_select_own_shop"
on public.shopreel_campaign_items
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_campaign_items_insert_own_shop" on public.shopreel_campaign_items;
create policy "shopreel_campaign_items_insert_own_shop"
on public.shopreel_campaign_items
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_campaign_items_update_own_shop" on public.shopreel_campaign_items;
create policy "shopreel_campaign_items_update_own_shop"
on public.shopreel_campaign_items
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());
