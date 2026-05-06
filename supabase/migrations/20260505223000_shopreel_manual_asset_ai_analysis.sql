-- AI analysis fields for reusable ShopReel manual asset library items.
-- Additive only. Supports MVP library tagging/use-case suggestions.

alter table public.shopreel_manual_assets
  add column if not exists ai_summary text null,
  add column if not exists ai_tags text[] not null default '{}',
  add column if not exists ai_use_cases text[] not null default '{}',
  add column if not exists ai_analysis jsonb not null default '{}'::jsonb,
  add column if not exists analyzed_at timestamptz null;

create index if not exists idx_shopreel_manual_assets_created_by_analyzed
  on public.shopreel_manual_assets (created_by, analyzed_at desc);

create index if not exists idx_shopreel_manual_assets_ai_tags
  on public.shopreel_manual_assets using gin (ai_tags);
