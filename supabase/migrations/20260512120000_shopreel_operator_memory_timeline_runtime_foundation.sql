begin;

create table if not exists public.shopreel_operator_sessions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_status text not null default 'active',
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shopreel_operator_memory (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.shopreel_operator_sessions(id) on delete set null,
  memory_key text not null,
  memory_kind text not null,
  unresolved boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (shop_id, user_id, memory_key)
);

create table if not exists public.shopreel_operator_workspace_state (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.shopreel_operator_sessions(id) on delete set null,
  runtime_state text not null,
  active_route text not null,
  focused_entity_kind text,
  focused_entity_id uuid,
  unresolved_count integer not null default 0,
  continuity_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shopreel_workspace_timeline_events (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid references public.shopreel_operator_sessions(id) on delete set null,
  entity_kind text not null,
  entity_id uuid,
  event_type text not null,
  unresolved boolean not null default false,
  reasoning_trace text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.shopreel_operator_sessions enable row level security;
alter table public.shopreel_operator_memory enable row level security;
alter table public.shopreel_operator_workspace_state enable row level security;
alter table public.shopreel_workspace_timeline_events enable row level security;

drop policy if exists "shopreel_operator_sessions_select" on public.shopreel_operator_sessions;
create policy "shopreel_operator_sessions_select"
  on public.shopreel_operator_sessions
  for select
  using (shop_id = public.current_tenant_shop_id() and user_id = auth.uid());

drop policy if exists "shopreel_operator_sessions_insert" on public.shopreel_operator_sessions;
create policy "shopreel_operator_sessions_insert"
  on public.shopreel_operator_sessions
  for insert
  with check (shop_id = public.current_tenant_shop_id() and user_id = auth.uid());

drop policy if exists "shopreel_operator_sessions_update" on public.shopreel_operator_sessions;
create policy "shopreel_operator_sessions_update"
  on public.shopreel_operator_sessions
  for update
  using (shop_id = public.current_tenant_shop_id() and user_id = auth.uid())
  with check (shop_id = public.current_tenant_shop_id() and user_id = auth.uid());

drop policy if exists "shopreel_operator_memory_select" on public.shopreel_operator_memory;
create policy "shopreel_operator_memory_select"
  on public.shopreel_operator_memory
  for select
  using (shop_id = public.current_tenant_shop_id() and user_id = auth.uid());

drop policy if exists "shopreel_operator_memory_insert" on public.shopreel_operator_memory;
create policy "shopreel_operator_memory_insert"
  on public.shopreel_operator_memory
  for insert
  with check (shop_id = public.current_tenant_shop_id() and user_id = auth.uid());

drop policy if exists "shopreel_operator_memory_update" on public.shopreel_operator_memory;
create policy "shopreel_operator_memory_update"
  on public.shopreel_operator_memory
  for update
  using (shop_id = public.current_tenant_shop_id() and user_id = auth.uid())
  with check (shop_id = public.current_tenant_shop_id() and user_id = auth.uid());

drop policy if exists "shopreel_operator_workspace_state_select" on public.shopreel_operator_workspace_state;
create policy "shopreel_operator_workspace_state_select"
  on public.shopreel_operator_workspace_state
  for select
  using (shop_id = public.current_tenant_shop_id() and user_id = auth.uid());

drop policy if exists "shopreel_operator_workspace_state_insert" on public.shopreel_operator_workspace_state;
create policy "shopreel_operator_workspace_state_insert"
  on public.shopreel_operator_workspace_state
  for insert
  with check (shop_id = public.current_tenant_shop_id() and user_id = auth.uid());

drop policy if exists "shopreel_operator_workspace_state_update" on public.shopreel_operator_workspace_state;
create policy "shopreel_operator_workspace_state_update"
  on public.shopreel_operator_workspace_state
  for update
  using (shop_id = public.current_tenant_shop_id() and user_id = auth.uid())
  with check (shop_id = public.current_tenant_shop_id() and user_id = auth.uid());

drop policy if exists "shopreel_workspace_timeline_events_select" on public.shopreel_workspace_timeline_events;
create policy "shopreel_workspace_timeline_events_select"
  on public.shopreel_workspace_timeline_events
  for select
  using (shop_id = public.current_tenant_shop_id());

drop policy if exists "shopreel_workspace_timeline_events_insert" on public.shopreel_workspace_timeline_events;
create policy "shopreel_workspace_timeline_events_insert"
  on public.shopreel_workspace_timeline_events
  for insert
  with check (
    shop_id = public.current_tenant_shop_id()
    and (user_id is null or user_id = auth.uid())
  );

create index if not exists idx_shopreel_operator_sessions_shop_user_updated
  on public.shopreel_operator_sessions (shop_id, user_id, updated_at desc);

create index if not exists idx_shopreel_operator_memory_shop_user_updated
  on public.shopreel_operator_memory (shop_id, user_id, updated_at desc);

create index if not exists idx_shopreel_operator_memory_session
  on public.shopreel_operator_memory (session_id);

create index if not exists idx_shopreel_operator_memory_unresolved
  on public.shopreel_operator_memory (shop_id, unresolved, updated_at desc);

create index if not exists idx_shopreel_operator_workspace_state_shop_user
  on public.shopreel_operator_workspace_state (shop_id, user_id, updated_at desc);

create index if not exists idx_shopreel_operator_workspace_state_session
  on public.shopreel_operator_workspace_state (session_id);

create index if not exists idx_shopreel_operator_workspace_state_unresolved
  on public.shopreel_operator_workspace_state (shop_id, unresolved_count, updated_at desc);

create index if not exists idx_shopreel_workspace_timeline_shop_created
  on public.shopreel_workspace_timeline_events (shop_id, created_at desc);

create index if not exists idx_shopreel_workspace_timeline_session
  on public.shopreel_workspace_timeline_events (session_id);

create index if not exists idx_shopreel_workspace_timeline_unresolved
  on public.shopreel_workspace_timeline_events (shop_id, unresolved, created_at desc);

commit;