create table if not exists public.shopreel_storyboards (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  title text not null,
  prompt text null,
  enhanced_prompt text null,
  style text null,
  visual_mode text null,
  aspect_ratio text not null default '9:16',
  source_generation_job_id uuid null references public.shopreel_media_generation_jobs(id) on delete set null,
  source_content_piece_id uuid null references public.content_pieces(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopreel_storyboard_scenes (
  id uuid primary key default gen_random_uuid(),
  storyboard_id uuid not null references public.shopreel_storyboards(id) on delete cascade,
  shop_id uuid not null,
  scene_order integer not null default 0,
  title text not null,
  prompt text null,
  overlay_text text null,
  voiceover_text text null,
  duration_seconds numeric null,
  source_asset_id uuid null references public.content_assets(id) on delete set null,
  generated_job_id uuid null references public.shopreel_media_generation_jobs(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopreel_storyboards_shop_id
  on public.shopreel_storyboards(shop_id);

create index if not exists idx_shopreel_storyboard_scenes_storyboard_id
  on public.shopreel_storyboard_scenes(storyboard_id);

create index if not exists idx_shopreel_storyboard_scenes_shop_id
  on public.shopreel_storyboard_scenes(shop_id);

alter table public.shopreel_storyboards enable row level security;
alter table public.shopreel_storyboard_scenes enable row level security;

drop policy if exists "shopreel_storyboards_select_own_shop" on public.shopreel_storyboards;
create policy "shopreel_storyboards_select_own_shop"
on public.shopreel_storyboards
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_storyboards_insert_own_shop" on public.shopreel_storyboards;
create policy "shopreel_storyboards_insert_own_shop"
on public.shopreel_storyboards
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_storyboards_update_own_shop" on public.shopreel_storyboards;
create policy "shopreel_storyboards_update_own_shop"
on public.shopreel_storyboards
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_storyboard_scenes_select_own_shop" on public.shopreel_storyboard_scenes;
create policy "shopreel_storyboard_scenes_select_own_shop"
on public.shopreel_storyboard_scenes
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_storyboard_scenes_insert_own_shop" on public.shopreel_storyboard_scenes;
create policy "shopreel_storyboard_scenes_insert_own_shop"
on public.shopreel_storyboard_scenes
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_storyboard_scenes_update_own_shop" on public.shopreel_storyboard_scenes;
create policy "shopreel_storyboard_scenes_update_own_shop"
on public.shopreel_storyboard_scenes
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());
