create table if not exists public.growth_engine_sources (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null default 'internal_owner',
  scope_id uuid not null,
  source_type text not null,
  display_name text not null,
  status text not null default 'active',
  config jsonb not null default '{}'::jsonb,
  last_scanned_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists growth_engine_sources_internal_codebase_idx
  on public.growth_engine_sources(scope_type, scope_id, source_type);

create table if not exists public.growth_engine_signals (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.growth_engine_sources(id) on delete cascade,
  feature_id uuid null references public.internal_growth_features(id) on delete set null,
  signal_key text not null,
  signal_type text not null,
  title text not null,
  description text not null,
  confidence numeric(5,2) not null default 0.50,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists growth_engine_signals_key_idx on public.growth_engine_signals(signal_key);

create table if not exists public.growth_engine_asset_plans (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.internal_growth_campaigns(id) on delete cascade,
  title text not null,
  asset_type text not null,
  target_platform text null,
  required_inputs jsonb not null default '[]'::jsonb,
  storyboard jsonb not null default '{}'::jsonb,
  shot_list jsonb not null default '[]'::jsonb,
  visual_direction text null,
  voiceover_script text null,
  caption text null,
  cta text null,
  status text not null default 'planned',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_growth_engine_sources_updated_at before update on public.growth_engine_sources for each row execute function public.set_updated_at();
create trigger set_growth_engine_signals_updated_at before update on public.growth_engine_signals for each row execute function public.set_updated_at();
create trigger set_growth_engine_asset_plans_updated_at before update on public.growth_engine_asset_plans for each row execute function public.set_updated_at();

alter table public.growth_engine_sources enable row level security;
alter table public.growth_engine_signals enable row level security;
alter table public.growth_engine_asset_plans enable row level security;

create policy "growth_engine_sources_owner_only" on public.growth_engine_sources for all using (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid())) with check (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid()));
create policy "growth_engine_signals_owner_only" on public.growth_engine_signals for all using (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid())) with check (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid()));
create policy "growth_engine_asset_plans_owner_only" on public.growth_engine_asset_plans for all using (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid())) with check (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid()));
