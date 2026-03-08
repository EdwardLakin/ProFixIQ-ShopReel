create table if not exists public.reel_render_jobs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  work_order_id uuid null,
  video_id uuid null references public.videos(id) on delete set null,
  status text not null default 'queued',
  source_type text null,
  source_id uuid null,
  render_payload jsonb not null,
  output_url text null,
  thumbnail_url text null,
  error_message text null,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
