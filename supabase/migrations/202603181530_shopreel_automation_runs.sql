create table if not exists public.shopreel_automation_runs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  run_type text not null default 'scheduled',
  status text not null default 'running',
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  queued_jobs_count integer not null default 0,
  processing_jobs_count integer not null default 0,
  synced_jobs_count integer not null default 0,
  active_campaigns_count integer not null default 0,
  learnings_count integer not null default 0,
  result_summary jsonb not null default '{}'::jsonb,
  error_text text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_shopreel_automation_runs_shop_id
  on public.shopreel_automation_runs(shop_id);

create index if not exists idx_shopreel_automation_runs_started_at
  on public.shopreel_automation_runs(started_at desc);

alter table public.shopreel_automation_runs enable row level security;

drop policy if exists "shopreel_automation_runs_select_own_shop" on public.shopreel_automation_runs;
create policy "shopreel_automation_runs_select_own_shop"
on public.shopreel_automation_runs
for select
using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_automation_runs_insert_own_shop" on public.shopreel_automation_runs;
create policy "shopreel_automation_runs_insert_own_shop"
on public.shopreel_automation_runs
for insert
with check (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_automation_runs_update_own_shop" on public.shopreel_automation_runs;
create policy "shopreel_automation_runs_update_own_shop"
on public.shopreel_automation_runs
for update
using (shop_id = public.current_tenant_shop_id())
with check (shop_id = public.current_tenant_shop_id());
