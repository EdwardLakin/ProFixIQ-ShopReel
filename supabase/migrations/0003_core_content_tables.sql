create table if not exists public.source_shop_links (
  id uuid primary key default gen_random_uuid(),
  source_shop_id uuid not null unique,
  tenant_shop_id uuid not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.content_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_shop_id uuid not null,
  source_shop_id uuid not null,
  source_system text not null default 'profixiq',
  name text not null,
  slug text null,
  description text null,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_calendars (
  id uuid primary key default gen_random_uuid(),
  tenant_shop_id uuid not null,
  source_shop_id uuid not null,
  source_system text not null default 'profixiq',
  name text not null,
  description text null,
  timezone text null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_shop_id uuid not null,
  source_shop_id uuid not null,
  source_vehicle_id uuid null,
  source_work_order_id uuid null,
  source_inspection_id uuid null,
  source_media_upload_id uuid null,
  source_inspection_photo_id uuid null,
  source_system text not null default 'profixiq',
  asset_type public.content_asset_type not null default 'other',
  title text null,
  caption text null,
  bucket text null,
  storage_path text null,
  public_url text null,
  mime_type text null,
  duration_seconds numeric null,
  file_size_bytes bigint null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_pieces (
  id uuid primary key default gen_random_uuid(),
  tenant_shop_id uuid not null,
  source_shop_id uuid not null,
  source_vehicle_id uuid null,
  source_work_order_id uuid null,
  source_inspection_id uuid null,
  source_media_upload_id uuid null,
  source_inspection_photo_id uuid null,
  source_system text not null default 'profixiq',
  template_id uuid null references public.content_templates(id) on delete set null,
  title text not null,
  hook text null,
  caption text null,
  cta text null,
  script_text text null,
  voiceover_text text null,
  status public.content_piece_status not null default 'draft',
  content_type text null,
  platform_targets text[] not null default '{}'::text[],
  render_url text null,
  thumbnail_url text null,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_calendar_items (
  id uuid primary key default gen_random_uuid(),
  tenant_shop_id uuid not null,
  source_shop_id uuid not null,
  source_system text not null default 'profixiq',
  calendar_id uuid not null references public.content_calendars(id) on delete cascade,
  content_piece_id uuid not null references public.content_pieces(id) on delete cascade,
  scheduled_for timestamptz null,
  status text not null default 'scheduled',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_events (
  id uuid primary key default gen_random_uuid(),
  tenant_shop_id uuid not null,
  source_shop_id uuid not null,
  source_vehicle_id uuid null,
  source_work_order_id uuid null,
  source_inspection_id uuid null,
  source_media_upload_id uuid null,
  source_inspection_photo_id uuid null,
  source_system text not null default 'profixiq',
  content_piece_id uuid null references public.content_pieces(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.content_platform_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_shop_id uuid not null,
  source_shop_id uuid not null,
  source_system text not null default 'profixiq',
  platform public.content_platform not null,
  platform_account_id text null,
  platform_username text null,
  access_token text null,
  refresh_token text null,
  token_expires_at timestamptz null,
  connection_active boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_publications (
  id uuid primary key default gen_random_uuid(),
  tenant_shop_id uuid not null,
  source_shop_id uuid not null,
  source_system text not null default 'profixiq',
  content_piece_id uuid not null references public.content_pieces(id) on delete cascade,
  platform_account_id uuid null references public.content_platform_accounts(id) on delete set null,
  platform public.content_platform not null,
  status public.content_publication_status not null default 'draft',
  scheduled_for timestamptz null,
  published_at timestamptz null,
  platform_post_id text null,
  platform_post_url text null,
  error_text text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_analytics_events (
  id uuid primary key default gen_random_uuid(),
  tenant_shop_id uuid not null,
  source_shop_id uuid not null,
  source_system text not null default 'profixiq',
  content_piece_id uuid null references public.content_pieces(id) on delete set null,
  publication_id uuid null references public.content_publications(id) on delete set null,
  platform public.content_platform null,
  event_name text not null,
  event_value numeric null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
