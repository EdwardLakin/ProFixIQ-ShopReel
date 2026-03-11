create table if not exists content_calendars (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  title text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft',
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists content_calendar_items (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references content_calendars(id) on delete cascade,
  shop_id uuid not null,
  publish_date date not null,
  content_type text not null,
  source_work_order_id uuid,
  source_video_id uuid,
  title text,
  hook text,
  caption text,
  cta text,
  platform_targets text[],
  status text not null default 'planned',
  created_at timestamptz default now()
);

create table if not exists shop_marketing_memory (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  memory_key text not null,
  memory_value jsonb not null default '{}'::jsonb,
  source_type text,
  source_id uuid,
  confidence numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_shop_marketing_memory_shop_key
  on shop_marketing_memory(shop_id, memory_key);

create table if not exists reel_plans (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  shop_id uuid not null,
  title text,
  hook text,
  voiceover_text text,
  shots jsonb not null default '[]'::jsonb,
  overlays jsonb not null default '[]'::jsonb,
  music_direction text,
  estimated_duration_seconds integer,
  status text not null default 'draft',
  created_at timestamptz default now()
);

create table if not exists viral_hook_tests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  video_id uuid references videos(id) on delete set null,
  content_type text,
  hook_text text not null,
  score_predicted numeric,
  selected boolean not null default false,
  created_at timestamptz default now()
);