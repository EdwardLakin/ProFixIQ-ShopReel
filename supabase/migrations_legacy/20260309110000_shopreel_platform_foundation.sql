begin;

create extension if not exists pgcrypto;

create table if not exists public.shopreel_social_connections (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,

  platform text not null check (
    platform in ('instagram_reels', 'facebook', 'youtube_shorts', 'tiktok')
  ),

  account_label text null,
  account_id text null,
  account_username text null,

  connection_active boolean not null default false,
  oauth_status text not null default 'disconnected' check (
    oauth_status in ('disconnected', 'connected', 'expired', 'error', 'revoked')
  ),

  access_token text null,
  refresh_token text null,
  token_expires_at timestamptz null,
  scopes text[] not null default '{}',

  metadata_json jsonb not null default '{}'::jsonb,

  last_sync_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (shop_id, platform)
);

create table if not exists public.shopreel_publications (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  connection_id uuid null references public.shopreel_social_connections(id) on delete set null,

  platform text not null check (
    platform in ('instagram_reels', 'facebook', 'youtube_shorts', 'tiktok')
  ),

  status text not null default 'queued' check (
    status in ('queued', 'processing', 'published', 'failed', 'cancelled')
  ),

  publish_mode text not null default 'manual' check (
    publish_mode in ('manual', 'scheduled', 'autopilot')
  ),

  scheduled_for timestamptz null,
  published_at timestamptz null,

  remote_post_id text null,
  remote_post_url text null,

  title_sent text null,
  caption_sent text null,
  video_url_sent text null,
  thumbnail_url_sent text null,

  attempt_count integer not null default 0,
  last_attempt_at timestamptz null,
  error_message text null,

  metadata_json jsonb not null default '{}'::jsonb,

  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopreel_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  publication_id uuid not null references public.shopreel_publications(id) on delete cascade,

  status text not null default 'queued' check (
    status in ('queued', 'processing', 'completed', 'failed', 'cancelled')
  ),

  run_after timestamptz not null default now(),
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,

  locked_at timestamptz null,
  locked_by text null,
  completed_at timestamptz null,

  error_message text null,
  metadata_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopreel_social_connections_shop_platform
  on public.shopreel_social_connections(shop_id, platform);

create index if not exists idx_shopreel_publications_shop_video
  on public.shopreel_publications(shop_id, video_id);

create index if not exists idx_shopreel_publications_status
  on public.shopreel_publications(status, scheduled_for);

create index if not exists idx_shopreel_publish_jobs_status_run_after
  on public.shopreel_publish_jobs(status, run_after);

create or replace function public.shopreel_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_shopreel_social_connections_updated_at on public.shopreel_social_connections;
create trigger trg_shopreel_social_connections_updated_at
before update on public.shopreel_social_connections
for each row
execute function public.shopreel_touch_updated_at();

drop trigger if exists trg_shopreel_publications_updated_at on public.shopreel_publications;
create trigger trg_shopreel_publications_updated_at
before update on public.shopreel_publications
for each row
execute function public.shopreel_touch_updated_at();

drop trigger if exists trg_shopreel_publish_jobs_updated_at on public.shopreel_publish_jobs;
create trigger trg_shopreel_publish_jobs_updated_at
before update on public.shopreel_publish_jobs
for each row
execute function public.shopreel_touch_updated_at();

alter table public.shopreel_social_connections enable row level security;
alter table public.shopreel_publications enable row level security;
alter table public.shopreel_publish_jobs enable row level security;

drop policy if exists shopreel_social_connections_select_shop on public.shopreel_social_connections;
create policy shopreel_social_connections_select_shop
on public.shopreel_social_connections
for select
to authenticated
using (shop_id = public.current_shop_id());

drop policy if exists shopreel_social_connections_insert_shop on public.shopreel_social_connections;
create policy shopreel_social_connections_insert_shop
on public.shopreel_social_connections
for insert
to authenticated
with check (shop_id = public.current_shop_id());

drop policy if exists shopreel_social_connections_update_shop on public.shopreel_social_connections;
create policy shopreel_social_connections_update_shop
on public.shopreel_social_connections
for update
to authenticated
using (shop_id = public.current_shop_id())
with check (shop_id = public.current_shop_id());

drop policy if exists shopreel_social_connections_delete_shop on public.shopreel_social_connections;
create policy shopreel_social_connections_delete_shop
on public.shopreel_social_connections
for delete
to authenticated
using (shop_id = public.current_shop_id());

drop policy if exists shopreel_publications_select_shop on public.shopreel_publications;
create policy shopreel_publications_select_shop
on public.shopreel_publications
for select
to authenticated
using (shop_id = public.current_shop_id());

drop policy if exists shopreel_publications_insert_shop on public.shopreel_publications;
create policy shopreel_publications_insert_shop
on public.shopreel_publications
for insert
to authenticated
with check (shop_id = public.current_shop_id());

drop policy if exists shopreel_publications_update_shop on public.shopreel_publications;
create policy shopreel_publications_update_shop
on public.shopreel_publications
for update
to authenticated
using (shop_id = public.current_shop_id())
with check (shop_id = public.current_shop_id());

drop policy if exists shopreel_publications_delete_shop on public.shopreel_publications;
create policy shopreel_publications_delete_shop
on public.shopreel_publications
for delete
to authenticated
using (shop_id = public.current_shop_id());

drop policy if exists shopreel_publish_jobs_select_shop on public.shopreel_publish_jobs;
create policy shopreel_publish_jobs_select_shop
on public.shopreel_publish_jobs
for select
to authenticated
using (shop_id = public.current_shop_id());

drop policy if exists shopreel_publish_jobs_insert_shop on public.shopreel_publish_jobs;
create policy shopreel_publish_jobs_insert_shop
on public.shopreel_publish_jobs
for insert
to authenticated
with check (shop_id = public.current_shop_id());

drop policy if exists shopreel_publish_jobs_update_shop on public.shopreel_publish_jobs;
create policy shopreel_publish_jobs_update_shop
on public.shopreel_publish_jobs
for update
to authenticated
using (shop_id = public.current_shop_id())
with check (shop_id = public.current_shop_id());

drop policy if exists shopreel_publish_jobs_delete_shop on public.shopreel_publish_jobs;
create policy shopreel_publish_jobs_delete_shop
on public.shopreel_publish_jobs
for delete
to authenticated
using (shop_id = public.current_shop_id());

commit;
