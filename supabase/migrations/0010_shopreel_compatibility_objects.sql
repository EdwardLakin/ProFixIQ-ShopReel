-- 0010_shopreel_compatibility_objects.sql
-- Restores missing ShopReel-owned compatibility objects in the new ShopReel DB.
-- This keeps content_* as the canonical model, while adding back legacy tables/views
-- the current app still expects.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at_compat()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- ---------------------------------------------------------------------------
-- shop_reel_settings
-- ---------------------------------------------------------------------------

create table if not exists public.shop_reel_settings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null unique,
  publish_mode text not null default 'manual'
    check (publish_mode in ('manual', 'approval_required', 'autopilot')),
  default_cta text null,
  default_location text null,
  brand_voice text null,
  enabled_platforms text[] not null default '{}'::text[],
  connected_platforms text[] not null default '{}'::text[],
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shop_reel_settings_shop_id
  on public.shop_reel_settings (shop_id);

drop trigger if exists trg_shop_reel_settings_set_updated_at on public.shop_reel_settings;
create trigger trg_shop_reel_settings_set_updated_at
before update on public.shop_reel_settings
for each row execute function public.set_updated_at_compat();

alter table public.shop_reel_settings enable row level security;

drop policy if exists shop_reel_settings_all on public.shop_reel_settings;
create policy shop_reel_settings_all
on public.shop_reel_settings
for all
using (shop_id::text = auth.jwt() ->> 'shop_id')
with check (shop_id::text = auth.jwt() ->> 'shop_id');

-- ---------------------------------------------------------------------------
-- shopreel_publish_jobs
-- ---------------------------------------------------------------------------

create table if not exists public.shopreel_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  publication_id uuid not null references public.content_publications(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  run_after timestamptz not null default now(),
  attempt_count integer not null default 0,
  error_message text null,
  locked_at timestamptz null,
  locked_by text null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopreel_publish_jobs_shop_id
  on public.shopreel_publish_jobs (shop_id);

create index if not exists idx_shopreel_publish_jobs_status_run_after
  on public.shopreel_publish_jobs (status, run_after);

drop trigger if exists trg_shopreel_publish_jobs_set_updated_at on public.shopreel_publish_jobs;
create trigger trg_shopreel_publish_jobs_set_updated_at
before update on public.shopreel_publish_jobs
for each row execute function public.set_updated_at_compat();

alter table public.shopreel_publish_jobs enable row level security;

drop policy if exists shopreel_publish_jobs_all on public.shopreel_publish_jobs;
create policy shopreel_publish_jobs_all
on public.shopreel_publish_jobs
for all
using (shop_id::text = auth.jwt() ->> 'shop_id')
with check (shop_id::text = auth.jwt() ->> 'shop_id');

-- ---------------------------------------------------------------------------
-- reel_render_jobs
-- ---------------------------------------------------------------------------

create table if not exists public.reel_render_jobs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  content_piece_id uuid null references public.content_pieces(id) on delete set null,
  publication_id uuid null references public.content_publications(id) on delete set null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  render_payload jsonb not null default '{}'::jsonb,
  render_url text null,
  thumbnail_url text null,
  error_message text null,
  attempt_count integer not null default 0,
  run_after timestamptz not null default now(),
  locked_at timestamptz null,
  locked_by text null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reel_render_jobs_shop_id
  on public.reel_render_jobs (shop_id);

create index if not exists idx_reel_render_jobs_status_run_after
  on public.reel_render_jobs (status, run_after);

drop trigger if exists trg_reel_render_jobs_set_updated_at on public.reel_render_jobs;
create trigger trg_reel_render_jobs_set_updated_at
before update on public.reel_render_jobs
for each row execute function public.set_updated_at_compat();

alter table public.reel_render_jobs enable row level security;

drop policy if exists reel_render_jobs_all on public.reel_render_jobs;
create policy reel_render_jobs_all
on public.reel_render_jobs
for all
using (shop_id::text = auth.jwt() ->> 'shop_id')
with check (shop_id::text = auth.jwt() ->> 'shop_id');

-- ---------------------------------------------------------------------------
-- reel_plans
-- ---------------------------------------------------------------------------

create table if not exists public.reel_plans (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  video_id uuid null,
  title text null,
  hook text null,
  voiceover_text text null,
  plan_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reel_plans_shop_id
  on public.reel_plans (shop_id);

create index if not exists idx_reel_plans_video_id
  on public.reel_plans (video_id);

drop trigger if exists trg_reel_plans_set_updated_at on public.reel_plans;
create trigger trg_reel_plans_set_updated_at
before update on public.reel_plans
for each row execute function public.set_updated_at_compat();

alter table public.reel_plans enable row level security;

drop policy if exists reel_plans_all on public.reel_plans;
create policy reel_plans_all
on public.reel_plans
for all
using (shop_id::text = auth.jwt() ->> 'shop_id')
with check (shop_id::text = auth.jwt() ->> 'shop_id');

-- ---------------------------------------------------------------------------
-- shop_marketing_memory
-- ---------------------------------------------------------------------------

create table if not exists public.shop_marketing_memory (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  memory_key text not null,
  memory_value jsonb not null default '{}'::jsonb,
  confidence numeric null,
  source_id uuid null,
  source_type text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, memory_key)
);

create index if not exists idx_shop_marketing_memory_shop_id
  on public.shop_marketing_memory (shop_id);

drop trigger if exists trg_shop_marketing_memory_set_updated_at on public.shop_marketing_memory;
create trigger trg_shop_marketing_memory_set_updated_at
before update on public.shop_marketing_memory
for each row execute function public.set_updated_at_compat();

alter table public.shop_marketing_memory enable row level security;

drop policy if exists shop_marketing_memory_all on public.shop_marketing_memory;
create policy shop_marketing_memory_all
on public.shop_marketing_memory
for all
using (shop_id::text = auth.jwt() ->> 'shop_id')
with check (shop_id::text = auth.jwt() ->> 'shop_id');

-- ---------------------------------------------------------------------------
-- shop_content_signals
-- ---------------------------------------------------------------------------

create table if not exists public.shop_content_signals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  content_type text not null,
  avg_engagement_score numeric null,
  total_views bigint not null default 0,
  total_posts integer not null default 0,
  last_posted_at timestamptz null,
  notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, content_type)
);

create index if not exists idx_shop_content_signals_shop_id
  on public.shop_content_signals (shop_id);

drop trigger if exists trg_shop_content_signals_set_updated_at on public.shop_content_signals;
create trigger trg_shop_content_signals_set_updated_at
before update on public.shop_content_signals
for each row execute function public.set_updated_at_compat();

alter table public.shop_content_signals enable row level security;

drop policy if exists shop_content_signals_all on public.shop_content_signals;
create policy shop_content_signals_all
on public.shop_content_signals
for all
using (shop_id::text = auth.jwt() ->> 'shop_id')
with check (shop_id::text = auth.jwt() ->> 'shop_id');

-- ---------------------------------------------------------------------------
-- video_metrics
-- ---------------------------------------------------------------------------

create table if not exists public.video_metrics (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  video_id uuid not null,
  platform text not null,
  video_platform_post_id text null,
  metric_date date not null,
  views bigint not null default 0,
  impressions bigint not null default 0,
  likes bigint not null default 0,
  comments bigint not null default 0,
  shares bigint not null default 0,
  saves bigint not null default 0,
  clicks bigint not null default 0,
  leads bigint not null default 0,
  bookings bigint not null default 0,
  revenue numeric not null default 0,
  watch_time_seconds numeric not null default 0,
  avg_watch_seconds numeric not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (video_id, platform, metric_date)
);

create index if not exists idx_video_metrics_shop_id
  on public.video_metrics (shop_id);

create index if not exists idx_video_metrics_video_id
  on public.video_metrics (video_id);

drop trigger if exists trg_video_metrics_set_updated_at on public.video_metrics;
create trigger trg_video_metrics_set_updated_at
before update on public.video_metrics
for each row execute function public.set_updated_at_compat();

alter table public.video_metrics enable row level security;

drop policy if exists video_metrics_all on public.video_metrics;
create policy video_metrics_all
on public.video_metrics
for all
using (shop_id::text = auth.jwt() ->> 'shop_id')
with check (shop_id::text = auth.jwt() ->> 'shop_id');

-- ---------------------------------------------------------------------------
-- Compatibility view: videos -> content_pieces
-- ---------------------------------------------------------------------------

drop view if exists public.videos;

create view public.videos as
select
  cp.id,
  cp.tenant_shop_id as shop_id,
  cp.template_id,
  cp.source_media_upload_id as source_asset_id,
  cp.title,
  null::text as slug,
  cp.status,
  cp.content_type,
  cp.hook,
  cp.caption,
  cp.cta,
  cp.script_text,
  cp.voiceover_text,
  cp.platform_targets,
  cp.published_at,
  cp.thumbnail_url,
  cp.render_url,
  null::numeric as duration_seconds,
  null::numeric as ai_score,
  null::numeric as human_rating,
  null::text as generation_notes,
  null::uuid as created_by,
  cp.created_at,
  cp.updated_at
from public.content_pieces cp;

-- ---------------------------------------------------------------------------
-- Compatibility view: video_publications -> content_publications
-- ---------------------------------------------------------------------------

drop view if exists public.video_publications;

create view public.video_publications as
select
  p.id,
  p.tenant_shop_id as shop_id,
  p.content_piece_id as video_id,
  p.platform_account_id as connection_id,
  p.platform,
  p.status,
  p.scheduled_for,
  p.published_at,
  p.platform_post_id as external_post_id,
  p.platform_post_url as external_url,
  null::text as caption_override,
  null::text as title_override,
  p.metadata as publish_payload_json,
  '{}'::jsonb as response_json,
  0::integer as attempt_count,
  p.error_text as error_message,
  null::uuid as created_by,
  p.created_at,
  p.updated_at
from public.content_publications p;

-- ---------------------------------------------------------------------------
-- Compatibility view: v_top_content_types_by_shop
-- ---------------------------------------------------------------------------

drop view if exists public.v_top_content_types_by_shop;

create view public.v_top_content_types_by_shop as
with metric_rollup as (
  select
    vm.shop_id,
    vm.video_id,
    sum(coalesce(vm.views, 0)) as total_views,
    avg(
      case
        when coalesce(vm.impressions, 0) > 0
          then (
            coalesce(vm.likes, 0) +
            coalesce(vm.comments, 0) * 2 +
            coalesce(vm.shares, 0) * 3 +
            coalesce(vm.saves, 0) * 2 +
            coalesce(vm.clicks, 0) * 4
          )::numeric / greatest(vm.impressions, 1)
        else 0
      end
    ) as avg_engagement_score
  from public.video_metrics vm
  group by vm.shop_id, vm.video_id
)
select
  v.shop_id,
  v.content_type,
  coalesce(avg(m.avg_engagement_score), 0)::numeric as avg_engagement_score,
  coalesce(sum(m.total_views), 0)::bigint as total_views,
  count(*)::integer as total_posts,
  max(v.published_at) as last_posted_at
from public.videos v
left join metric_rollup m
  on m.video_id = v.id
 and m.shop_id = v.shop_id
group by v.shop_id, v.content_type;

-- ---------------------------------------------------------------------------
-- Helpful backfill from current canonical tables
-- ---------------------------------------------------------------------------

insert into public.shop_reel_settings (
  shop_id,
  publish_mode,
  default_cta,
  default_location,
  brand_voice,
  enabled_platforms,
  connected_platforms,
  onboarding_completed
)
select distinct
  cpa.tenant_shop_id as shop_id,
  'manual'::text as publish_mode,
  null::text as default_cta,
  null::text as default_location,
  null::text as brand_voice,
  coalesce(array_agg(distinct cpa.platform) filter (where cpa.connection_active), '{}'::content_platform[]),
coalesce(array_agg(distinct cpa.platform) filter (where cpa.connection_active), '{}'::content_platform[]),
  false
from public.content_platform_accounts cpa
group by cpa.tenant_shop_id
on conflict (shop_id) do nothing;

