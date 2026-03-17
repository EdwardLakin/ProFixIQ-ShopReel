create extension if not exists pgcrypto;

create table if not exists public.global_content_benchmarks (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  content_type text not null,
  avg_engagement_score numeric not null default 0,
  avg_views numeric not null default 0,
  avg_impressions numeric not null default 0,
  total_posts integer not null default 0,
  benchmark_window_days integer not null default 90,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, content_type, benchmark_window_days)
);

create index if not exists idx_global_content_benchmarks_platform_type
  on public.global_content_benchmarks(platform, content_type);

drop trigger if exists trg_global_content_benchmarks_updated_at on public.global_content_benchmarks;
create trigger trg_global_content_benchmarks_updated_at
before update on public.global_content_benchmarks
for each row execute function public.set_updated_at_compat();
