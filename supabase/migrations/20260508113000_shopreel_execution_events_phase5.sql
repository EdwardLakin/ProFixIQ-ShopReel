create table if not exists public.shopreel_execution_events (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  execution_id uuid not null references public.shopreel_agent_executions(id) on delete cascade,
  task_id uuid null references public.shopreel_agent_tasks(id) on delete set null,
  run_id uuid null references public.shopreel_agent_runs(id) on delete set null,
  campaign_id uuid null references public.shopreel_campaigns(id) on delete set null,
  event_type text not null check (event_type in ('created', 'prepared', 'blocked', 'failed', 'canceled', 'validated', 'note')),
  previous_status text null,
  next_status text null,
  message text null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists shopreel_execution_events_shop_id_idx
  on public.shopreel_execution_events(shop_id);
create index if not exists shopreel_execution_events_execution_id_idx
  on public.shopreel_execution_events(execution_id);
create index if not exists shopreel_execution_events_task_id_idx
  on public.shopreel_execution_events(task_id);
create index if not exists shopreel_execution_events_campaign_id_idx
  on public.shopreel_execution_events(campaign_id);
create index if not exists shopreel_execution_events_event_type_idx
  on public.shopreel_execution_events(event_type);
create index if not exists shopreel_execution_events_created_at_idx
  on public.shopreel_execution_events(created_at desc);

alter table public.shopreel_execution_events enable row level security;

drop policy if exists "shopreel_execution_events_shop_access"
  on public.shopreel_execution_events;

create policy "shopreel_execution_events_shop_access"
  on public.shopreel_execution_events
  for all
  using (shop_id = public.current_tenant_shop_id())
  with check (shop_id = public.current_tenant_shop_id());
