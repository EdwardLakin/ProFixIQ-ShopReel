create table if not exists public.shopreel_export_packages (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  generation_id uuid null references public.shopreel_story_generations(id) on delete set null,
  render_job_id uuid null references public.reel_render_jobs(id) on delete set null,
  content_piece_id uuid null references public.content_pieces(id) on delete set null,
  status text not null default 'draft',
  mp4_path text null,
  thumbnail_path text null,
  caption_text text null,
  hashtags jsonb not null default '[]'::jsonb,
  platform_outputs jsonb not null default '{}'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  exported_at timestamptz null
);
create unique index if not exists idx_shopreel_export_packages_shop_render_job on public.shopreel_export_packages (shop_id, render_job_id) where render_job_id is not null;
create index if not exists idx_shopreel_export_packages_shop_created on public.shopreel_export_packages (shop_id, created_at desc);
