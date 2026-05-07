create table if not exists public.shopreel_agent_executions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  task_id uuid not null references public.shopreel_agent_tasks(id) on delete cascade,
  run_id uuid null references public.shopreel_agent_runs(id) on delete set null,
  campaign_id uuid null references public.shopreel_campaigns(id) on delete set null,
  execution_type text not null check (execution_type in ('story_generation','render_preparation','publish_preparation','analytics_snapshot')),
  status text not null default 'pending' check (status in ('pending','prepared','blocked','canceled','failed')),
  generation_id uuid null references public.shopreel_story_generations(id) on delete set null,
  render_job_id uuid null references public.reel_render_jobs(id) on delete set null,
  publication_id uuid null references public.content_publications(id) on delete set null,
  input_snapshot jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  trace jsonb not null default '{}'::jsonb,
  error_message text null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shopreel_agent_executions_shop_id_idx on public.shopreel_agent_executions(shop_id);
create index if not exists shopreel_agent_executions_task_id_idx on public.shopreel_agent_executions(task_id);
create index if not exists shopreel_agent_executions_run_id_idx on public.shopreel_agent_executions(run_id);
create index if not exists shopreel_agent_executions_campaign_id_idx on public.shopreel_agent_executions(campaign_id);
create index if not exists shopreel_agent_executions_status_idx on public.shopreel_agent_executions(status);
create index if not exists shopreel_agent_executions_updated_at_idx on public.shopreel_agent_executions(updated_at desc);

create unique index if not exists shopreel_agent_executions_task_active_idx
  on public.shopreel_agent_executions(task_id)
  where status in ('pending','prepared','blocked');

drop trigger if exists set_shopreel_agent_executions_updated_at on public.shopreel_agent_executions;

create trigger set_shopreel_agent_executions_updated_at
  before update on public.shopreel_agent_executions
  for each row execute function public.set_updated_at();

alter table public.shopreel_agent_executions enable row level security;

drop policy if exists "shopreel_agent_executions_shop_access" on public.shopreel_agent_executions;

create policy "shopreel_agent_executions_shop_access"
  on public.shopreel_agent_executions
  for all
  using (shop_id = public.current_tenant_shop_id())
  with check (shop_id = public.current_tenant_shop_id());
