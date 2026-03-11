create table if not exists public.processed_source_events (
  event_id uuid primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create table if not exists public.data_migration_ledger (
  id bigserial primary key,
  migration_name text not null,
  entity_name text not null,
  source_id uuid not null,
  target_id uuid not null,
  status text not null,
  checksum text null,
  error_text text null,
  created_at timestamptz not null default now()
);
