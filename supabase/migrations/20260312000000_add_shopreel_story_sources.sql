create table if not exists public.shopreel_story_sources (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,

  title text not null,
  description text,
  kind text not null,
  origin text not null,
  generation_mode text not null default 'manual',

  occurred_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,

  project_id text,
  project_name text,
  vehicle_label text,
  customer_label text,
  technician_label text,

  tags text[] not null default '{}',
  notes text[] not null default '{}',

  facts jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,

  source_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopreel_story_source_assets (
  id uuid primary key default gen_random_uuid(),
  story_source_id uuid not null references public.shopreel_story_sources(id) on delete cascade,
  shop_id uuid not null,

  asset_type text not null,
  content_asset_id uuid references public.content_assets(id) on delete set null,
  manual_asset_id uuid references public.shopreel_manual_assets(id) on delete set null,

  url text,
  title text,
  caption text,
  note text,
  taken_at timestamptz,
  sort_order integer not null default 0,

  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shopreel_story_source_refs (
  id uuid primary key default gen_random_uuid(),
  story_source_id uuid not null references public.shopreel_story_sources(id) on delete cascade,
  shop_id uuid not null,

  ref_type text not null,
  ref_id text not null,

  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shopreel_story_generations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  story_source_id uuid not null references public.shopreel_story_sources(id) on delete cascade,
  content_piece_id uuid references public.content_pieces(id) on delete set null,
  reel_plan_id uuid references public.reel_plans(id) on delete set null,
  render_job_id uuid references public.reel_render_jobs(id) on delete set null,

  status text not null default 'draft',
  story_draft jsonb not null default '{}'::jsonb,
  generation_metadata jsonb not null default '{}'::jsonb,

  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_shopreel_story_sources_shop_source_key
  on public.shopreel_story_sources(shop_id, source_key)
  where source_key is not null;

create index if not exists idx_shopreel_story_sources_shop_created
  on public.shopreel_story_sources(shop_id, created_at desc);

create index if not exists idx_shopreel_story_sources_shop_kind
  on public.shopreel_story_sources(shop_id, kind);

create index if not exists idx_shopreel_story_source_assets_story_source
  on public.shopreel_story_source_assets(story_source_id, sort_order);

create index if not exists idx_shopreel_story_source_assets_shop
  on public.shopreel_story_source_assets(shop_id, created_at desc);

create index if not exists idx_shopreel_story_source_refs_story_source
  on public.shopreel_story_source_refs(story_source_id);

create index if not exists idx_shopreel_story_generations_shop_created
  on public.shopreel_story_generations(shop_id, created_at desc);

create index if not exists idx_shopreel_story_generations_story_source
  on public.shopreel_story_generations(story_source_id, created_at desc);

create or replace function public.set_shopreel_story_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_shopreel_story_sources_updated_at on public.shopreel_story_sources;
create trigger trg_shopreel_story_sources_updated_at
before update on public.shopreel_story_sources
for each row
execute function public.set_shopreel_story_updated_at();

drop trigger if exists trg_shopreel_story_generations_updated_at on public.shopreel_story_generations;
create trigger trg_shopreel_story_generations_updated_at
before update on public.shopreel_story_generations
for each row
execute function public.set_shopreel_story_updated_at();

alter table public.shopreel_story_sources enable row level security;
alter table public.shopreel_story_source_assets enable row level security;
alter table public.shopreel_story_source_refs enable row level security;
alter table public.shopreel_story_generations enable row level security;

drop policy if exists "shopreel_story_sources_select" on public.shopreel_story_sources;
create policy "shopreel_story_sources_select"
on public.shopreel_story_sources
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_sources_insert" on public.shopreel_story_sources;
create policy "shopreel_story_sources_insert"
on public.shopreel_story_sources
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_sources_update" on public.shopreel_story_sources;
create policy "shopreel_story_sources_update"
on public.shopreel_story_sources
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_sources_delete" on public.shopreel_story_sources;
create policy "shopreel_story_sources_delete"
on public.shopreel_story_sources
for delete
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_source_assets_select" on public.shopreel_story_source_assets;
create policy "shopreel_story_source_assets_select"
on public.shopreel_story_source_assets
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_source_assets_insert" on public.shopreel_story_source_assets;
create policy "shopreel_story_source_assets_insert"
on public.shopreel_story_source_assets
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_source_assets_update" on public.shopreel_story_source_assets;
create policy "shopreel_story_source_assets_update"
on public.shopreel_story_source_assets
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_source_assets_delete" on public.shopreel_story_source_assets;
create policy "shopreel_story_source_assets_delete"
on public.shopreel_story_source_assets
for delete
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_source_refs_select" on public.shopreel_story_source_refs;
create policy "shopreel_story_source_refs_select"
on public.shopreel_story_source_refs
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_source_refs_insert" on public.shopreel_story_source_refs;
create policy "shopreel_story_source_refs_insert"
on public.shopreel_story_source_refs
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_source_refs_update" on public.shopreel_story_source_refs;
create policy "shopreel_story_source_refs_update"
on public.shopreel_story_source_refs
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_source_refs_delete" on public.shopreel_story_source_refs;
create policy "shopreel_story_source_refs_delete"
on public.shopreel_story_source_refs
for delete
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_generations_select" on public.shopreel_story_generations;
create policy "shopreel_story_generations_select"
on public.shopreel_story_generations
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_generations_insert" on public.shopreel_story_generations;
create policy "shopreel_story_generations_insert"
on public.shopreel_story_generations
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_generations_update" on public.shopreel_story_generations;
create policy "shopreel_story_generations_update"
on public.shopreel_story_generations
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_story_generations_delete" on public.shopreel_story_generations;
create policy "shopreel_story_generations_delete"
on public.shopreel_story_generations
for delete
using (shop_id = public.current_tenant_shop_id());
