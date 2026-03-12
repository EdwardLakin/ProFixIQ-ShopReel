create table if not exists public.shopreel_creator_requests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  mode text not null check (
    mode in ('research_script', 'angle_pack', 'debunk', 'stitch')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'processing', 'ready', 'failed')
  ),
  title text,
  topic text,
  audience text,
  tone text,
  platform_focus text,
  source_asset_id uuid,
  source_url text,
  source_generation_id uuid references public.shopreel_story_generations(id) on delete set null,
  source_story_source_id uuid references public.shopreel_story_sources(id) on delete set null,
  source_publication_id uuid references public.content_publications(id) on delete set null,
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  error_text text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopreel_creator_requests_shop_created
  on public.shopreel_creator_requests(shop_id, created_at desc);

create index if not exists idx_shopreel_creator_requests_mode
  on public.shopreel_creator_requests(shop_id, mode, created_at desc);

create index if not exists idx_shopreel_creator_requests_generation
  on public.shopreel_creator_requests(source_generation_id);

create index if not exists idx_shopreel_creator_requests_story_source
  on public.shopreel_creator_requests(source_story_source_id);
