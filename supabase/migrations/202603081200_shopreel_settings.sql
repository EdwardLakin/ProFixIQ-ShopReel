create extension if not exists pgcrypto;

create table if not exists public.shop_reel_settings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null unique,
  publish_mode text not null default 'manual'
    check (publish_mode in ('manual', 'approval_required', 'autopilot')),
  default_cta text,
  default_location text,
  brand_voice text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_reel_platform_settings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  platform text not null
    check (platform in ('instagram_reels', 'facebook', 'youtube_shorts', 'tiktok')),
  enabled boolean not null default false,
  connection_active boolean not null default false,
  connection_status text not null default 'not_connected'
    check (connection_status in ('not_connected', 'connected', 'expired', 'error')),
  publish_mode text not null default 'manual'
    check (publish_mode in ('manual', 'scheduled', 'autopilot')),
  account_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, platform)
);

create table if not exists public.shop_reel_brand_profiles (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null unique,
  brand_name text,
  brand_pitch text,
  primary_color text,
  secondary_color text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.shop_reel_settings (
  shop_id,
  publish_mode,
  default_cta,
  default_location,
  brand_voice,
  onboarding_completed
)
values (
  'e4d23a6d-9418-49a5-8a1b-6a2640615b5b',
  'manual',
  'Book your inspection today.',
  'Calgary, Alberta',
  'Straightforward, trustworthy, expert mechanic voice.',
  false
)
on conflict (shop_id) do nothing;

insert into public.shop_reel_platform_settings (
  shop_id,
  platform,
  enabled,
  connection_active,
  connection_status,
  publish_mode
)
values
  ('e4d23a6d-9418-49a5-8a1b-6a2640615b5b', 'instagram_reels', true, false, 'not_connected', 'manual'),
  ('e4d23a6d-9418-49a5-8a1b-6a2640615b5b', 'facebook', true, false, 'not_connected', 'manual'),
  ('e4d23a6d-9418-49a5-8a1b-6a2640615b5b', 'youtube_shorts', true, false, 'not_connected', 'manual'),
  ('e4d23a6d-9418-49a5-8a1b-6a2640615b5b', 'tiktok', false, false, 'not_connected', 'manual')
on conflict (shop_id, platform) do nothing;

insert into public.shop_reel_brand_profiles (
  shop_id,
  brand_name,
  brand_pitch,
  primary_color,
  secondary_color
)
values (
  'e4d23a6d-9418-49a5-8a1b-6a2640615b5b',
  'ProFixIQ ShopReel',
  'AI content engine for repair shops.',
  '#b86d3f',
  '#22d3ee'
)
on conflict (shop_id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_shop_reel_settings_updated_at on public.shop_reel_settings;
create trigger trg_shop_reel_settings_updated_at
before update on public.shop_reel_settings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_shop_reel_platform_settings_updated_at on public.shop_reel_platform_settings;
create trigger trg_shop_reel_platform_settings_updated_at
before update on public.shop_reel_platform_settings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_shop_reel_brand_profiles_updated_at on public.shop_reel_brand_profiles;
create trigger trg_shop_reel_brand_profiles_updated_at
before update on public.shop_reel_brand_profiles
for each row
execute function public.set_updated_at();

alter table public.shop_reel_settings enable row level security;
alter table public.shop_reel_platform_settings enable row level security;
alter table public.shop_reel_brand_profiles enable row level security;

drop policy if exists shop_reel_settings_select on public.shop_reel_settings;
create policy shop_reel_settings_select
on public.shop_reel_settings
for select
to authenticated
using (shop_id = public.current_shop_id());

drop policy if exists shop_reel_settings_insert on public.shop_reel_settings;
create policy shop_reel_settings_insert
on public.shop_reel_settings
for insert
to authenticated
with check (shop_id = public.current_shop_id());

drop policy if exists shop_reel_settings_update on public.shop_reel_settings;
create policy shop_reel_settings_update
on public.shop_reel_settings
for update
to authenticated
using (shop_id = public.current_shop_id())
with check (shop_id = public.current_shop_id());

drop policy if exists shop_reel_platform_settings_select on public.shop_reel_platform_settings;
create policy shop_reel_platform_settings_select
on public.shop_reel_platform_settings
for select
to authenticated
using (shop_id = public.current_shop_id());

drop policy if exists shop_reel_platform_settings_insert on public.shop_reel_platform_settings;
create policy shop_reel_platform_settings_insert
on public.shop_reel_platform_settings
for insert
to authenticated
with check (shop_id = public.current_shop_id());

drop policy if exists shop_reel_platform_settings_update on public.shop_reel_platform_settings;
create policy shop_reel_platform_settings_update
on public.shop_reel_platform_settings
for update
to authenticated
using (shop_id = public.current_shop_id())
with check (shop_id = public.current_shop_id());

drop policy if exists shop_reel_brand_profiles_select on public.shop_reel_brand_profiles;
create policy shop_reel_brand_profiles_select
on public.shop_reel_brand_profiles
for select
to authenticated
using (shop_id = public.current_shop_id());

drop policy if exists shop_reel_brand_profiles_insert on public.shop_reel_brand_profiles;
create policy shop_reel_brand_profiles_insert
on public.shop_reel_brand_profiles
for insert
to authenticated
with check (shop_id = public.current_shop_id());

drop policy if exists shop_reel_brand_profiles_update on public.shop_reel_brand_profiles;
create policy shop_reel_brand_profiles_update
on public.shop_reel_brand_profiles
for update
to authenticated
using (shop_id = public.current_shop_id())
with check (shop_id = public.current_shop_id());
