create table if not exists public.internal_growth_agent_admins (
  user_id uuid primary key,
  created_at timestamptz not null default now(),
  created_by uuid null
);

create table if not exists public.internal_growth_agent_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null,
  status text not null check (status in ('pending','running','completed','failed')),
  source_type text not null check (source_type in ('code_scan','manual_seed','changelog')),
  summary text null,
  error_message text null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.internal_growth_features (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  run_id uuid null references public.internal_growth_agent_runs(id) on delete set null,
  feature_key text not null unique,
  title text not null,
  description text not null,
  route_path text null,
  source_files jsonb not null default '[]'::jsonb,
  audience text not null,
  value_props jsonb not null default '[]'::jsonb,
  launch_angle text not null,
  status text not null default 'discovered' check (status in ('discovered','approved','ignored'))
);

create table if not exists public.internal_growth_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  feature_id uuid null references public.internal_growth_features(id) on delete set null,
  title text not null,
  campaign_type text not null check (campaign_type in ('feature_launch','build_in_public','comparison','tutorial','demo_reel','founder_note')),
  objective text not null,
  target_platforms jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','approved','archived')),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.internal_growth_drafts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  campaign_id uuid not null references public.internal_growth_campaigns(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok','youtube_shorts','linkedin','x','blog')),
  format text not null check (format in ('short_video_script','caption','carousel_outline','blog_outline','launch_post','thumbnail_prompt')),
  title text not null,
  body text not null,
  hook text null,
  cta text null,
  status text not null default 'draft' check (status in ('draft','approved','rejected','archived')),
  score jsonb null,
  metadata jsonb not null default '{}'::jsonb
);

create trigger set_internal_growth_features_updated_at before update on public.internal_growth_features for each row execute function public.set_updated_at();
create trigger set_internal_growth_campaigns_updated_at before update on public.internal_growth_campaigns for each row execute function public.set_updated_at();
create trigger set_internal_growth_drafts_updated_at before update on public.internal_growth_drafts for each row execute function public.set_updated_at();

alter table public.internal_growth_agent_admins enable row level security;
alter table public.internal_growth_agent_runs enable row level security;
alter table public.internal_growth_features enable row level security;
alter table public.internal_growth_campaigns enable row level security;
alter table public.internal_growth_drafts enable row level security;

create policy "internal_growth_agent_admins_select_self" on public.internal_growth_agent_admins for select using (user_id = auth.uid());

create policy "internal_growth_runs_owner_only" on public.internal_growth_agent_runs for all using (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid())) with check (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid()));
create policy "internal_growth_features_owner_only" on public.internal_growth_features for all using (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid())) with check (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid()));
create policy "internal_growth_campaigns_owner_only" on public.internal_growth_campaigns for all using (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid())) with check (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid()));
create policy "internal_growth_drafts_owner_only" on public.internal_growth_drafts for all using (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid())) with check (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid()));
