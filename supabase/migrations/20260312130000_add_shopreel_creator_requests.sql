create table if not exists public.shopreel_creator_requests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  mode text not null check (mode in ('research_script', 'angle_pack', 'debunk', 'stitch')),
  status text not null default 'draft' check (status in ('draft', 'ready', 'generated', 'archived', 'failed')),
  title text not null,
  topic text not null,
  audience text null,
  tone text null,
  platform_focus text null,
  source_story_source_id uuid null references public.shopreel_story_sources(id) on delete set null,
  source_generation_id uuid null references public.shopreel_story_generations(id) on delete set null,
  source_url text null,
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopreel_creator_requests_shop_id
  on public.shopreel_creator_requests(shop_id);

create index if not exists idx_shopreel_creator_requests_mode
  on public.shopreel_creator_requests(shop_id, mode);

create index if not exists idx_shopreel_creator_requests_status
  on public.shopreel_creator_requests(shop_id, status);

create index if not exists idx_shopreel_creator_requests_story_source_id
  on public.shopreel_creator_requests(source_story_source_id);

create index if not exists idx_shopreel_creator_requests_generation_id
  on public.shopreel_creator_requests(source_generation_id);

alter table public.shopreel_creator_requests enable row level security;

drop policy if exists "shopreel_creator_requests_select" on public.shopreel_creator_requests;
create policy "shopreel_creator_requests_select"
on public.shopreel_creator_requests
for select
using (true);

drop policy if exists "shopreel_creator_requests_insert" on public.shopreel_creator_requests;
create policy "shopreel_creator_requests_insert"
on public.shopreel_creator_requests
for insert
with check (true);

drop policy if exists "shopreel_creator_requests_update" on public.shopreel_creator_requests;
create policy "shopreel_creator_requests_update"
on public.shopreel_creator_requests
for update
using (true);

drop policy if exists "shopreel_creator_requests_delete" on public.shopreel_creator_requests;
create policy "shopreel_creator_requests_delete"
on public.shopreel_creator_requests
for delete
using (true);

drop trigger if exists set_shopreel_creator_requests_updated_at on public.shopreel_creator_requests;
create trigger set_shopreel_creator_requests_updated_at
before update on public.shopreel_creator_requests
for each row
execute function public.set_updated_at();
