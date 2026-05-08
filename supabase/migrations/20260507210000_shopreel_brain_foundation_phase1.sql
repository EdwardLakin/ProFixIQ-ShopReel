create table if not exists public.shopreel_brand_brain_profiles (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.tenant_shops(id) on delete cascade,
  status text not null default 'active' check (status in ('active','archived')),
  positioning text null,
  brand_voice_rules text null,
  prohibited_claims text[] not null default '{}'::text[],
  preferred_ctas text[] not null default '{}'::text[],
  visual_style_notes text null,
  audience_notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id)
);

create table if not exists public.shopreel_campaign_brains (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.tenant_shops(id) on delete cascade,
  campaign_id uuid not null references public.shopreel_campaigns(id) on delete cascade,
  status text not null default 'active' check (status in ('active','archived')),
  campaign_objective text null,
  target_audience text null,
  channel_priorities text[] not null default '{}'::text[],
  content_pillars text[] not null default '{}'::text[],
  experiment_hypotheses text[] not null default '{}'::text[],
  success_signals text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id)
);

create index if not exists shopreel_brand_brain_profiles_shop_id_idx on public.shopreel_brand_brain_profiles(shop_id);
create index if not exists shopreel_brand_brain_profiles_status_idx on public.shopreel_brand_brain_profiles(status);
create index if not exists shopreel_brand_brain_profiles_updated_at_idx on public.shopreel_brand_brain_profiles(updated_at desc);

create index if not exists shopreel_campaign_brains_shop_id_idx on public.shopreel_campaign_brains(shop_id);
create index if not exists shopreel_campaign_brains_campaign_id_idx on public.shopreel_campaign_brains(campaign_id);
create index if not exists shopreel_campaign_brains_status_idx on public.shopreel_campaign_brains(status);
create index if not exists shopreel_campaign_brains_updated_at_idx on public.shopreel_campaign_brains(updated_at desc);

create trigger set_shopreel_brand_brain_profiles_updated_at
  before update on public.shopreel_brand_brain_profiles
  for each row execute function public.set_updated_at();

create trigger set_shopreel_campaign_brains_updated_at
  before update on public.shopreel_campaign_brains
  for each row execute function public.set_updated_at();

alter table public.shopreel_brand_brain_profiles enable row level security;
alter table public.shopreel_campaign_brains enable row level security;

create policy "shopreel_brand_brain_profiles_shop_access"
  on public.shopreel_brand_brain_profiles
  for all
  using (shop_id = public.current_tenant_shop_id())
  with check (shop_id = public.current_tenant_shop_id());

create policy "shopreel_campaign_brains_shop_access"
  on public.shopreel_campaign_brains
  for all
  using (shop_id = public.current_tenant_shop_id())
  with check (shop_id = public.current_tenant_shop_id());
