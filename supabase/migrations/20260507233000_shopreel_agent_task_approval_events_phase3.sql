create table if not exists public.shopreel_agent_task_approval_events (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  task_id uuid not null references public.shopreel_agent_tasks(id) on delete cascade,
  run_id uuid null references public.shopreel_agent_runs(id) on delete set null,
  campaign_id uuid null references public.shopreel_campaigns(id) on delete set null,
  action text not null check (action in ('approved','rejected','canceled','commented')),
  reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists shopreel_agent_task_approval_events_shop_id_idx
  on public.shopreel_agent_task_approval_events(shop_id);
create index if not exists shopreel_agent_task_approval_events_task_id_idx
  on public.shopreel_agent_task_approval_events(task_id);
create index if not exists shopreel_agent_task_approval_events_run_id_idx
  on public.shopreel_agent_task_approval_events(run_id);
create index if not exists shopreel_agent_task_approval_events_campaign_id_idx
  on public.shopreel_agent_task_approval_events(campaign_id);
create index if not exists shopreel_agent_task_approval_events_action_idx
  on public.shopreel_agent_task_approval_events(action);
create index if not exists shopreel_agent_task_approval_events_created_at_idx
  on public.shopreel_agent_task_approval_events(created_at desc);

alter table public.shopreel_agent_task_approval_events enable row level security;

drop policy if exists "shopreel_agent_task_approval_events_shop_access"
  on public.shopreel_agent_task_approval_events;

create policy "shopreel_agent_task_approval_events_shop_access"
  on public.shopreel_agent_task_approval_events
  for all
  using (shop_id = public.current_tenant_shop_id())
  with check (shop_id = public.current_tenant_shop_id());
