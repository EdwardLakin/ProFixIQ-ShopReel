-- ShopReel core schema
-- Multi-tenant, shop-scoped, AI-learning-ready

create extension if not exists pgcrypto;

-- =========================================================
-- updated_at helper
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- profiles
-- Mirrors auth users at app level
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- =========================================================
-- shops
-- A company/shop account inside ShopReel
-- =========================================================
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  website_url text,
  brand_primary text,
  brand_secondary text,
  logo_url text,
  timezone text default 'America/Edmonton',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_shops_updated_at on public.shops;
create trigger trg_shops_updated_at
before update on public.shops
for each row
execute function public.set_updated_at();

alter table public.shops enable row level security;

-- =========================================================
-- shop_users
-- Membership / role map
-- =========================================================
create table if not exists public.shop_users (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner','admin','editor','viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create index if not exists idx_shop_users_shop_id on public.shop_users(shop_id);
create index if not exists idx_shop_users_user_id on public.shop_users(user_id);

drop trigger if exists trg_shop_users_updated_at on public.shop_users;
create trigger trg_shop_users_updated_at
before update on public.shop_users
for each row
execute function public.set_updated_at();

alter table public.shop_users enable row level security;

-- =========================================================
-- Helper: current user's accessible shop
-- Keep simple for single-shop-per-user use now
-- =========================================================
create or replace function public.user_is_in_shop(target_shop_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.shop_users su
    where su.shop_id = target_shop_id
      and su.user_id = auth.uid()
      and su.is_active = true
  );
$$;

-- =========================================================
-- content_templates
-- Reusable formats like workflow_demo, repair_story, etc.
-- =========================================================
create table if not exists public.content_templates (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  default_hook text,
  default_cta text,
  script_guidance text,
  visual_guidance text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, key)
);

create index if not exists idx_content_templates_shop_id on public.content_templates(shop_id);

drop trigger if exists trg_content_templates_updated_at on public.content_templates;
create trigger trg_content_templates_updated_at
before update on public.content_templates
for each row
execute function public.set_updated_at();

alter table public.content_templates enable row level security;

-- =========================================================
-- assets
-- Raw uploaded media / generated media references
-- =========================================================
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  storage_bucket text,
  storage_path text,
  public_url text,
  mime_type text,
  asset_type text not null default 'video'
    check (asset_type in ('video','image','audio','document','other')),
  source text not null default 'upload'
    check (source in ('upload','generated','imported')),
  duration_seconds numeric(10,2),
  width integer,
  height integer,
  size_bytes bigint,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assets_shop_id on public.assets(shop_id);
create index if not exists idx_assets_source on public.assets(source);

drop trigger if exists trg_assets_updated_at on public.assets;
create trigger trg_assets_updated_at
before update on public.assets
for each row
execute function public.set_updated_at();

alter table public.assets enable row level security;

-- =========================================================
-- videos
-- Main marketing content record
-- =========================================================
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  template_id uuid references public.content_templates(id) on delete set null,
  source_asset_id uuid references public.assets(id) on delete set null,
  title text not null,
  slug text,
  status text not null default 'draft'
    check (status in ('draft','queued','processing','ready','published','failed','archived')),
  content_type text not null
    check (content_type in (
      'workflow_demo',
      'repair_story',
      'inspection_highlight',
      'before_after',
      'educational_tip',
      'how_to',
      'findings_on_vehicle'
    )),
  hook text,
  caption text,
  cta text,
  script_text text,
  voiceover_text text,
  platform_targets text[] not null default '{}'::text[],
  published_at timestamptz,
  thumbnail_url text,
  render_url text,
  duration_seconds numeric(10,2),
  generation_notes text,
  ai_score numeric(6,2),
  human_rating integer check (human_rating between 1 and 5),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_videos_shop_id on public.videos(shop_id);
create index if not exists idx_videos_status on public.videos(status);
create index if not exists idx_videos_content_type on public.videos(content_type);
create index if not exists idx_videos_published_at on public.videos(published_at);

drop trigger if exists trg_videos_updated_at on public.videos;
create trigger trg_videos_updated_at
before update on public.videos
for each row
execute function public.set_updated_at();

alter table public.videos enable row level security;

-- =========================================================
-- video_platform_posts
-- Per-platform posting records
-- =========================================================
create table if not exists public.video_platform_posts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  platform text not null
    check (platform in ('instagram','facebook','tiktok','youtube','linkedin','x','other')),
  external_post_id text,
  external_url text,
  post_status text not null default 'draft'
    check (post_status in ('draft','scheduled','published','failed','archived')),
  scheduled_for timestamptz,
  published_at timestamptz,
  caption_override text,
  hashtag_set text[] not null default '{}'::text[],
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (video_id, platform)
);

create index if not exists idx_video_platform_posts_shop_id on public.video_platform_posts(shop_id);
create index if not exists idx_video_platform_posts_video_id on public.video_platform_posts(video_id);
create index if not exists idx_video_platform_posts_platform on public.video_platform_posts(platform);

drop trigger if exists trg_video_platform_posts_updated_at on public.video_platform_posts;
create trigger trg_video_platform_posts_updated_at
before update on public.video_platform_posts
for each row
execute function public.set_updated_at();

alter table public.video_platform_posts enable row level security;

-- =========================================================
-- video_metrics
-- Rollup metrics by platform/post/date
-- =========================================================
create table if not exists public.video_metrics (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  video_platform_post_id uuid references public.video_platform_posts(id) on delete cascade,
  metric_date date not null default current_date,
  platform text not null
    check (platform in ('instagram','facebook','tiktok','youtube','linkedin','x','other')),
  impressions integer not null default 0,
  views integer not null default 0,
  watch_time_seconds numeric(14,2) not null default 0,
  avg_watch_seconds numeric(14,2) not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  saves integer not null default 0,
  clicks integer not null default 0,
  leads integer not null default 0,
  bookings integer not null default 0,
  revenue numeric(12,2) not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (video_id, platform, metric_date)
);

create index if not exists idx_video_metrics_shop_id on public.video_metrics(shop_id);
create index if not exists idx_video_metrics_video_id on public.video_metrics(video_id);
create index if not exists idx_video_metrics_platform on public.video_metrics(platform);
create index if not exists idx_video_metrics_metric_date on public.video_metrics(metric_date);

drop trigger if exists trg_video_metrics_updated_at on public.video_metrics;
create trigger trg_video_metrics_updated_at
before update on public.video_metrics
for each row
execute function public.set_updated_at();

alter table public.video_metrics enable row level security;

-- =========================================================
-- ai_generation_runs
-- Full trace of prompt/run/output
-- =========================================================
create table if not exists public.ai_generation_runs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_id uuid references public.videos(id) on delete set null,
  template_id uuid references public.content_templates(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  provider text,
  model text,
  prompt_version text,
  system_prompt text,
  user_prompt text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued','running','completed','failed','cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  tokens_input integer,
  tokens_output integer,
  estimated_cost numeric(12,4),
  score_predicted numeric(6,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_generation_runs_shop_id on public.ai_generation_runs(shop_id);
create index if not exists idx_ai_generation_runs_video_id on public.ai_generation_runs(video_id);
create index if not exists idx_ai_generation_runs_status on public.ai_generation_runs(status);

drop trigger if exists trg_ai_generation_runs_updated_at on public.ai_generation_runs;
create trigger trg_ai_generation_runs_updated_at
before update on public.ai_generation_runs
for each row
execute function public.set_updated_at();

alter table public.ai_generation_runs enable row level security;

-- =========================================================
-- learning_feedback
-- Human + performance feedback loop
-- =========================================================
create table if not exists public.learning_feedback (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  ai_generation_run_id uuid references public.ai_generation_runs(id) on delete cascade,
  feedback_type text not null
    check (feedback_type in (
      'thumbs_up',
      'thumbs_down',
      'edited_caption',
      'edited_hook',
      'edited_cta',
      'published',
      'high_performer',
      'low_performer',
      'manual_note'
    )),
  score numeric(6,2),
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_learning_feedback_shop_id on public.learning_feedback(shop_id);
create index if not exists idx_learning_feedback_video_id on public.learning_feedback(video_id);
create index if not exists idx_learning_feedback_run_id on public.learning_feedback(ai_generation_run_id);
create index if not exists idx_learning_feedback_type on public.learning_feedback(feedback_type);

alter table public.learning_feedback enable row level security;

-- =========================================================
-- lead_events
-- Optional attribution from content to outcomes
-- =========================================================
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_id uuid references public.videos(id) on delete set null,
  video_platform_post_id uuid references public.video_platform_posts(id) on delete set null,
  event_type text not null
    check (event_type in ('click','form_submit','call','message','booking','other')),
  source_platform text
    check (source_platform in ('instagram','facebook','tiktok','youtube','linkedin','x','other')),
  lead_value numeric(12,2),
  occurred_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_lead_events_shop_id on public.lead_events(shop_id);
create index if not exists idx_lead_events_video_id on public.lead_events(video_id);
create index if not exists idx_lead_events_occurred_at on public.lead_events(occurred_at);

alter table public.lead_events enable row level security;

-- =========================================================
-- RLS policies: shop-scoped
-- =========================================================

-- shops
drop policy if exists "shops_select_member" on public.shops;
create policy "shops_select_member"
on public.shops
for select
to authenticated
using (public.user_is_in_shop(id));

drop policy if exists "shops_insert_authenticated" on public.shops;
create policy "shops_insert_authenticated"
on public.shops
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "shops_update_member" on public.shops;
create policy "shops_update_member"
on public.shops
for update
to authenticated
using (public.user_is_in_shop(id))
with check (public.user_is_in_shop(id));

-- shop_users
drop policy if exists "shop_users_select_member" on public.shop_users;
create policy "shop_users_select_member"
on public.shop_users
for select
to authenticated
using (public.user_is_in_shop(shop_id));

drop policy if exists "shop_users_insert_member" on public.shop_users;
create policy "shop_users_insert_member"
on public.shop_users
for insert
to authenticated
with check (public.user_is_in_shop(shop_id));

drop policy if exists "shop_users_update_member" on public.shop_users;
create policy "shop_users_update_member"
on public.shop_users
for update
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

-- shared helper macro pattern by table
drop policy if exists "content_templates_all_member" on public.content_templates;
create policy "content_templates_all_member"
on public.content_templates
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "assets_all_member" on public.assets;
create policy "assets_all_member"
on public.assets
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "videos_all_member" on public.videos;
create policy "videos_all_member"
on public.videos
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "video_platform_posts_all_member" on public.video_platform_posts;
create policy "video_platform_posts_all_member"
on public.video_platform_posts
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "video_metrics_all_member" on public.video_metrics;
create policy "video_metrics_all_member"
on public.video_metrics
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "ai_generation_runs_all_member" on public.ai_generation_runs;
create policy "ai_generation_runs_all_member"
on public.ai_generation_runs
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "learning_feedback_all_member" on public.learning_feedback;
create policy "learning_feedback_all_member"
on public.learning_feedback
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "lead_events_all_member" on public.lead_events;
create policy "lead_events_all_member"
on public.lead_events
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

-- =========================================================
-- Seed starter templates for a first shop later via app flow
-- Not auto-inserting here because we don't know shop_id yet
-- =========================================================-- ShopReel core schema
-- Multi-tenant, shop-scoped, AI-learning-ready

create extension if not exists pgcrypto;

-- =========================================================
-- updated_at helper
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- profiles
-- Mirrors auth users at app level
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- =========================================================
-- shops
-- A company/shop account inside ShopReel
-- =========================================================
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  website_url text,
  brand_primary text,
  brand_secondary text,
  logo_url text,
  timezone text default 'America/Edmonton',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_shops_updated_at on public.shops;
create trigger trg_shops_updated_at
before update on public.shops
for each row
execute function public.set_updated_at();

alter table public.shops enable row level security;

-- =========================================================
-- shop_users
-- Membership / role map
-- =========================================================
create table if not exists public.shop_users (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner','admin','editor','viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create index if not exists idx_shop_users_shop_id on public.shop_users(shop_id);
create index if not exists idx_shop_users_user_id on public.shop_users(user_id);

drop trigger if exists trg_shop_users_updated_at on public.shop_users;
create trigger trg_shop_users_updated_at
before update on public.shop_users
for each row
execute function public.set_updated_at();

alter table public.shop_users enable row level security;

-- =========================================================
-- Helper: current user's accessible shop
-- Keep simple for single-shop-per-user use now
-- =========================================================
create or replace function public.user_is_in_shop(target_shop_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.shop_users su
    where su.shop_id = target_shop_id
      and su.user_id = auth.uid()
      and su.is_active = true
  );
$$;

-- =========================================================
-- content_templates
-- Reusable formats like workflow_demo, repair_story, etc.
-- =========================================================
create table if not exists public.content_templates (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  default_hook text,
  default_cta text,
  script_guidance text,
  visual_guidance text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, key)
);

create index if not exists idx_content_templates_shop_id on public.content_templates(shop_id);

drop trigger if exists trg_content_templates_updated_at on public.content_templates;
create trigger trg_content_templates_updated_at
before update on public.content_templates
for each row
execute function public.set_updated_at();

alter table public.content_templates enable row level security;

-- =========================================================
-- assets
-- Raw uploaded media / generated media references
-- =========================================================
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  storage_bucket text,
  storage_path text,
  public_url text,
  mime_type text,
  asset_type text not null default 'video'
    check (asset_type in ('video','image','audio','document','other')),
  source text not null default 'upload'
    check (source in ('upload','generated','imported')),
  duration_seconds numeric(10,2),
  width integer,
  height integer,
  size_bytes bigint,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assets_shop_id on public.assets(shop_id);
create index if not exists idx_assets_source on public.assets(source);

drop trigger if exists trg_assets_updated_at on public.assets;
create trigger trg_assets_updated_at
before update on public.assets
for each row
execute function public.set_updated_at();

alter table public.assets enable row level security;

-- =========================================================
-- videos
-- Main marketing content record
-- =========================================================
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  template_id uuid references public.content_templates(id) on delete set null,
  source_asset_id uuid references public.assets(id) on delete set null,
  title text not null,
  slug text,
  status text not null default 'draft'
    check (status in ('draft','queued','processing','ready','published','failed','archived')),
  content_type text not null
    check (content_type in (
      'workflow_demo',
      'repair_story',
      'inspection_highlight',
      'before_after',
      'educational_tip',
      'how_to',
      'findings_on_vehicle'
    )),
  hook text,
  caption text,
  cta text,
  script_text text,
  voiceover_text text,
  platform_targets text[] not null default '{}'::text[],
  published_at timestamptz,
  thumbnail_url text,
  render_url text,
  duration_seconds numeric(10,2),
  generation_notes text,
  ai_score numeric(6,2),
  human_rating integer check (human_rating between 1 and 5),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_videos_shop_id on public.videos(shop_id);
create index if not exists idx_videos_status on public.videos(status);
create index if not exists idx_videos_content_type on public.videos(content_type);
create index if not exists idx_videos_published_at on public.videos(published_at);

drop trigger if exists trg_videos_updated_at on public.videos;
create trigger trg_videos_updated_at
before update on public.videos
for each row
execute function public.set_updated_at();

alter table public.videos enable row level security;

-- =========================================================
-- video_platform_posts
-- Per-platform posting records
-- =========================================================
create table if not exists public.video_platform_posts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  platform text not null
    check (platform in ('instagram','facebook','tiktok','youtube','linkedin','x','other')),
  external_post_id text,
  external_url text,
  post_status text not null default 'draft'
    check (post_status in ('draft','scheduled','published','failed','archived')),
  scheduled_for timestamptz,
  published_at timestamptz,
  caption_override text,
  hashtag_set text[] not null default '{}'::text[],
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (video_id, platform)
);

create index if not exists idx_video_platform_posts_shop_id on public.video_platform_posts(shop_id);
create index if not exists idx_video_platform_posts_video_id on public.video_platform_posts(video_id);
create index if not exists idx_video_platform_posts_platform on public.video_platform_posts(platform);

drop trigger if exists trg_video_platform_posts_updated_at on public.video_platform_posts;
create trigger trg_video_platform_posts_updated_at
before update on public.video_platform_posts
for each row
execute function public.set_updated_at();

alter table public.video_platform_posts enable row level security;

-- =========================================================
-- video_metrics
-- Rollup metrics by platform/post/date
-- =========================================================
create table if not exists public.video_metrics (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  video_platform_post_id uuid references public.video_platform_posts(id) on delete cascade,
  metric_date date not null default current_date,
  platform text not null
    check (platform in ('instagram','facebook','tiktok','youtube','linkedin','x','other')),
  impressions integer not null default 0,
  views integer not null default 0,
  watch_time_seconds numeric(14,2) not null default 0,
  avg_watch_seconds numeric(14,2) not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  saves integer not null default 0,
  clicks integer not null default 0,
  leads integer not null default 0,
  bookings integer not null default 0,
  revenue numeric(12,2) not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (video_id, platform, metric_date)
);

create index if not exists idx_video_metrics_shop_id on public.video_metrics(shop_id);
create index if not exists idx_video_metrics_video_id on public.video_metrics(video_id);
create index if not exists idx_video_metrics_platform on public.video_metrics(platform);
create index if not exists idx_video_metrics_metric_date on public.video_metrics(metric_date);

drop trigger if exists trg_video_metrics_updated_at on public.video_metrics;
create trigger trg_video_metrics_updated_at
before update on public.video_metrics
for each row
execute function public.set_updated_at();

alter table public.video_metrics enable row level security;

-- =========================================================
-- ai_generation_runs
-- Full trace of prompt/run/output
-- =========================================================
create table if not exists public.ai_generation_runs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_id uuid references public.videos(id) on delete set null,
  template_id uuid references public.content_templates(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  provider text,
  model text,
  prompt_version text,
  system_prompt text,
  user_prompt text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued','running','completed','failed','cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  tokens_input integer,
  tokens_output integer,
  estimated_cost numeric(12,4),
  score_predicted numeric(6,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_generation_runs_shop_id on public.ai_generation_runs(shop_id);
create index if not exists idx_ai_generation_runs_video_id on public.ai_generation_runs(video_id);
create index if not exists idx_ai_generation_runs_status on public.ai_generation_runs(status);

drop trigger if exists trg_ai_generation_runs_updated_at on public.ai_generation_runs;
create trigger trg_ai_generation_runs_updated_at
before update on public.ai_generation_runs
for each row
execute function public.set_updated_at();

alter table public.ai_generation_runs enable row level security;

-- =========================================================
-- learning_feedback
-- Human + performance feedback loop
-- =========================================================
create table if not exists public.learning_feedback (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  ai_generation_run_id uuid references public.ai_generation_runs(id) on delete cascade,
  feedback_type text not null
    check (feedback_type in (
      'thumbs_up',
      'thumbs_down',
      'edited_caption',
      'edited_hook',
      'edited_cta',
      'published',
      'high_performer',
      'low_performer',
      'manual_note'
    )),
  score numeric(6,2),
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_learning_feedback_shop_id on public.learning_feedback(shop_id);
create index if not exists idx_learning_feedback_video_id on public.learning_feedback(video_id);
create index if not exists idx_learning_feedback_run_id on public.learning_feedback(ai_generation_run_id);
create index if not exists idx_learning_feedback_type on public.learning_feedback(feedback_type);

alter table public.learning_feedback enable row level security;

-- =========================================================
-- lead_events
-- Optional attribution from content to outcomes
-- =========================================================
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_id uuid references public.videos(id) on delete set null,
  video_platform_post_id uuid references public.video_platform_posts(id) on delete set null,
  event_type text not null
    check (event_type in ('click','form_submit','call','message','booking','other')),
  source_platform text
    check (source_platform in ('instagram','facebook','tiktok','youtube','linkedin','x','other')),
  lead_value numeric(12,2),
  occurred_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_lead_events_shop_id on public.lead_events(shop_id);
create index if not exists idx_lead_events_video_id on public.lead_events(video_id);
create index if not exists idx_lead_events_occurred_at on public.lead_events(occurred_at);

alter table public.lead_events enable row level security;

-- =========================================================
-- RLS policies: shop-scoped
-- =========================================================

-- shops
drop policy if exists "shops_select_member" on public.shops;
create policy "shops_select_member"
on public.shops
for select
to authenticated
using (public.user_is_in_shop(id));

drop policy if exists "shops_insert_authenticated" on public.shops;
create policy "shops_insert_authenticated"
on public.shops
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "shops_update_member" on public.shops;
create policy "shops_update_member"
on public.shops
for update
to authenticated
using (public.user_is_in_shop(id))
with check (public.user_is_in_shop(id));

-- shop_users
drop policy if exists "shop_users_select_member" on public.shop_users;
create policy "shop_users_select_member"
on public.shop_users
for select
to authenticated
using (public.user_is_in_shop(shop_id));

drop policy if exists "shop_users_insert_member" on public.shop_users;
create policy "shop_users_insert_member"
on public.shop_users
for insert
to authenticated
with check (public.user_is_in_shop(shop_id));

drop policy if exists "shop_users_update_member" on public.shop_users;
create policy "shop_users_update_member"
on public.shop_users
for update
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

-- shared helper macro pattern by table
drop policy if exists "content_templates_all_member" on public.content_templates;
create policy "content_templates_all_member"
on public.content_templates
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "assets_all_member" on public.assets;
create policy "assets_all_member"
on public.assets
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "videos_all_member" on public.videos;
create policy "videos_all_member"
on public.videos
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "video_platform_posts_all_member" on public.video_platform_posts;
create policy "video_platform_posts_all_member"
on public.video_platform_posts
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "video_metrics_all_member" on public.video_metrics;
create policy "video_metrics_all_member"
on public.video_metrics
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "ai_generation_runs_all_member" on public.ai_generation_runs;
create policy "ai_generation_runs_all_member"
on public.ai_generation_runs
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "learning_feedback_all_member" on public.learning_feedback;
create policy "learning_feedback_all_member"
on public.learning_feedback
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

drop policy if exists "lead_events_all_member" on public.lead_events;
create policy "lead_events_all_member"
on public.lead_events
for all
to authenticated
using (public.user_is_in_shop(shop_id))
with check (public.user_is_in_shop(shop_id));

-- =========================================================
-- Seed starter templates for a first shop later via app flow
-- Not auto-inserting here because we don't know shop_id yet
-- =========================================================