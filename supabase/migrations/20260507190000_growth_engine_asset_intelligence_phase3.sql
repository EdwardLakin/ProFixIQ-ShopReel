create table if not exists growth_engine_asset_sources (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references growth_engine_sources(id) on delete cascade,
  campaign_id uuid references internal_growth_campaigns(id) on delete set null,
  asset_plan_id uuid references growth_engine_asset_plans(id) on delete set null,
  asset_source_type text not null check (asset_source_type in ('uploaded_image','uploaded_video','ui_screenshot','generated_thumbnail','render_output','brand_asset','placeholder')),
  title text not null,
  storage_path text,
  mime_type text not null,
  width integer,
  height integer,
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'missing' check (status in ('missing','uploaded','generated','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_growth_engine_asset_sources_source on growth_engine_asset_sources(source_id);
create index if not exists idx_growth_engine_asset_sources_campaign on growth_engine_asset_sources(campaign_id);
create index if not exists idx_growth_engine_asset_sources_asset_plan on growth_engine_asset_sources(asset_plan_id);

create table if not exists growth_engine_screenshot_requests (
  id uuid primary key default gen_random_uuid(),
  asset_plan_id uuid not null references growth_engine_asset_plans(id) on delete cascade,
  title text not null,
  route_hint text,
  viewport text not null check (viewport in ('desktop','tablet','mobile')),
  priority integer not null default 50,
  annotation text,
  status text not null default 'requested' check (status in ('requested','captured','approved','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_growth_engine_screenshot_requests_asset_plan on growth_engine_screenshot_requests(asset_plan_id);

create table if not exists growth_engine_brand_kits (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references growth_engine_sources(id) on delete set null,
  scope text not null default 'internal',
  brand_name text not null,
  logo_asset_source_id uuid references growth_engine_asset_sources(id) on delete set null,
  primary_color text,
  secondary_color text,
  font_family text,
  tone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists growth_engine_render_compositions (
  id uuid primary key default gen_random_uuid(),
  asset_plan_id uuid not null references growth_engine_asset_plans(id) on delete cascade,
  composition_type text not null check (composition_type in ('short_video','carousel','promo_clip','launch_graphic')),
  timeline jsonb not null default '[]'::jsonb,
  scenes jsonb not null default '[]'::jsonb,
  overlays jsonb not null default '[]'::jsonb,
  captions jsonb not null default '[]'::jsonb,
  transitions jsonb not null default '[]'::jsonb,
  soundtrack_direction text,
  voiceover_direction text,
  duration_seconds integer not null default 15,
  aspect_ratio text not null default '9:16',
  render_status text not null default 'draft' check (render_status in ('draft','ready','rendering','completed','failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists growth_engine_render_jobs (
  id uuid primary key default gen_random_uuid(),
  composition_id uuid not null references growth_engine_render_compositions(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','preparing','rendering','completed','failed')),
  progress integer not null default 0,
  provider text,
  output_asset_source_id uuid references growth_engine_asset_sources(id) on delete set null,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_growth_engine_render_jobs_composition on growth_engine_render_jobs(composition_id);
