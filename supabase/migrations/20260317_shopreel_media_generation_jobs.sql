create table if not exists public.shopreel_media_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  created_by uuid null,
  source_generation_id uuid null references public.shopreel_story_generations(id) on delete set null,
  source_content_piece_id uuid null references public.content_pieces(id) on delete set null,

  provider text not null default 'openai',
  job_type text not null check (job_type in ('image','video','asset_assembly')),
  status text not null default 'queued' check (status in ('queued','processing','completed','failed','cancelled')),

  prompt text null,
  prompt_enhanced text null,
  negative_prompt text null,

  title text null,
  style text null,
  visual_mode text null,
  aspect_ratio text not null default '9:16',
  duration_seconds numeric null,

  input_asset_ids uuid[] not null default '{}',
  output_asset_id uuid null references public.content_assets(id) on delete set null,

  model text null,
  provider_job_id text null,
  preview_url text null,
  error_text text null,

  settings jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,

  run_after timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopreel_media_generation_jobs_shop_id
  on public.shopreel_media_generation_jobs(shop_id);

create index if not exists idx_shopreel_media_generation_jobs_status
  on public.shopreel_media_generation_jobs(status);

create index if not exists idx_shopreel_media_generation_jobs_job_type
  on public.shopreel_media_generation_jobs(job_type);

create index if not exists idx_shopreel_media_generation_jobs_run_after
  on public.shopreel_media_generation_jobs(run_after);

create index if not exists idx_shopreel_media_generation_jobs_source_generation_id
  on public.shopreel_media_generation_jobs(source_generation_id);

alter table public.shopreel_media_generation_jobs enable row level security;

drop policy if exists "shopreel_media_generation_jobs_select_own_shop" on public.shopreel_media_generation_jobs;
create policy "shopreel_media_generation_jobs_select_own_shop"
on public.shopreel_media_generation_jobs
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_media_generation_jobs_insert_own_shop" on public.shopreel_media_generation_jobs;
create policy "shopreel_media_generation_jobs_insert_own_shop"
on public.shopreel_media_generation_jobs
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_media_generation_jobs_update_own_shop" on public.shopreel_media_generation_jobs;
create policy "shopreel_media_generation_jobs_update_own_shop"
on public.shopreel_media_generation_jobs
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());
