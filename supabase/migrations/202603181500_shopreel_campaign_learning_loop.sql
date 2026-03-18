create table if not exists public.shopreel_campaign_analytics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shopreel_campaigns(id) on delete cascade,
  shop_id uuid not null,
  total_items integer not null default 0,
  total_media_jobs integer not null default 0,
  total_completed_jobs integer not null default 0,
  total_content_pieces integer not null default 0,
  total_publications integer not null default 0,
  total_published integer not null default 0,
  total_views numeric not null default 0,
  total_engagement numeric not null default 0,
  winning_angle text null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id)
);

create table if not exists public.shopreel_campaign_learnings (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shopreel_campaigns(id) on delete cascade,
  campaign_item_id uuid null references public.shopreel_campaign_items(id) on delete set null,
  shop_id uuid not null,
  learning_type text not null,
  learning_key text not null,
  learning_value jsonb not null default '{}'::jsonb,
  confidence numeric null,
  created_at timestamptz not null default now()
);

create index if not exists idx_shopreel_campaign_analytics_campaign_id
  on public.shopreel_campaign_analytics(campaign_id);

create index if not exists idx_shopreel_campaign_learnings_campaign_id
  on public.shopreel_campaign_learnings(campaign_id);

create index if not exists idx_shopreel_campaign_learnings_shop_id
  on public.shopreel_campaign_learnings(shop_id);

alter table public.shopreel_campaign_analytics enable row level security;
alter table public.shopreel_campaign_learnings enable row level security;

drop policy if exists "shopreel_campaign_analytics_select_own_shop" on public.shopreel_campaign_analytics;
create policy "shopreel_campaign_analytics_select_own_shop"
on public.shopreel_campaign_analytics
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_campaign_analytics_insert_own_shop" on public.shopreel_campaign_analytics;
create policy "shopreel_campaign_analytics_insert_own_shop"
on public.shopreel_campaign_analytics
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_campaign_analytics_update_own_shop" on public.shopreel_campaign_analytics;
create policy "shopreel_campaign_analytics_update_own_shop"
on public.shopreel_campaign_analytics
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_campaign_learnings_select_own_shop" on public.shopreel_campaign_learnings;
create policy "shopreel_campaign_learnings_select_own_shop"
on public.shopreel_campaign_learnings
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_campaign_learnings_insert_own_shop" on public.shopreel_campaign_learnings;
create policy "shopreel_campaign_learnings_insert_own_shop"
on public.shopreel_campaign_learnings
for insert
with check (shop_id = public.current_tenant_shop_id());
