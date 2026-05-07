create table if not exists public.shopreel_agent_runs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  campaign_id uuid null references public.shopreel_campaigns(id) on delete set null,
  agent_type text not null check (agent_type in ('content_strategist','script_storyboard','editor','render','publish','analytics')),
  status text not null default 'planned' check (status in ('planned','approved','rejected','archived')),
  input_snapshot jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  trace jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) null,
  requires_approval boolean not null default true,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopreel_agent_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.shopreel_agent_runs(id) on delete cascade,
  shop_id uuid not null,
  campaign_id uuid null references public.shopreel_campaigns(id) on delete set null,
  generation_id uuid null references public.shopreel_story_generations(id) on delete set null,
  render_job_id uuid null references public.reel_render_jobs(id) on delete set null,
  publication_id uuid null references public.content_publications(id) on delete set null,
  agent_type text not null check (agent_type in ('content_strategist','script_storyboard','editor','render','publish','analytics')),
  task_type text not null check (task_type in ('create_content_idea','draft_script','draft_storyboard','suggest_edit','suggest_render','suggest_publish','analyze_performance')),
  status text not null default 'proposed' check (status in ('proposed','approved','rejected','canceled')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  title text not null,
  details text null,
  input_snapshot jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  trace jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) null,
  requires_approval boolean not null default true,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shopreel_agent_runs_shop_id_idx on public.shopreel_agent_runs(shop_id);
create index if not exists shopreel_agent_runs_campaign_id_idx on public.shopreel_agent_runs(campaign_id);
create index if not exists shopreel_agent_runs_agent_type_idx on public.shopreel_agent_runs(agent_type);
create index if not exists shopreel_agent_runs_status_idx on public.shopreel_agent_runs(status);
create index if not exists shopreel_agent_runs_updated_at_idx on public.shopreel_agent_runs(updated_at desc);

create index if not exists shopreel_agent_tasks_shop_id_idx on public.shopreel_agent_tasks(shop_id);
create index if not exists shopreel_agent_tasks_campaign_id_idx on public.shopreel_agent_tasks(campaign_id);
create index if not exists shopreel_agent_tasks_agent_type_idx on public.shopreel_agent_tasks(agent_type);
create index if not exists shopreel_agent_tasks_status_idx on public.shopreel_agent_tasks(status);
create index if not exists shopreel_agent_tasks_updated_at_idx on public.shopreel_agent_tasks(updated_at desc);

drop trigger if exists set_shopreel_agent_runs_updated_at on public.shopreel_agent_runs;

create trigger set_shopreel_agent_runs_updated_at
  before update on public.shopreel_agent_runs
  for each row execute function public.set_updated_at();

drop trigger if exists set_shopreel_agent_tasks_updated_at on public.shopreel_agent_tasks;

create trigger set_shopreel_agent_tasks_updated_at
  before update on public.shopreel_agent_tasks
  for each row execute function public.set_updated_at();

alter table public.shopreel_agent_runs enable row level security;
alter table public.shopreel_agent_tasks enable row level security;

create policy "shopreel_agent_runs_shop_access"
  on public.shopreel_agent_runs
  for all
  using (shop_id = public.current_tenant_shop_id())
  with check (shop_id = public.current_tenant_shop_id());

create policy "shopreel_agent_tasks_shop_access"
  on public.shopreel_agent_tasks
  for all
  using (shop_id = public.current_tenant_shop_id())
  with check (shop_id = public.current_tenant_shop_id());
