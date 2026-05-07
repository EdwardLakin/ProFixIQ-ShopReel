alter table public.internal_growth_features
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.internal_growth_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid not null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before_state jsonb null,
  after_state jsonb null,
  created_at timestamptz not null default now()
);

create unique index if not exists internal_growth_campaigns_dedupe_idx
  on public.internal_growth_campaigns(feature_id, campaign_type, target_platforms);

alter table public.internal_growth_audit_logs enable row level security;

create policy "internal_growth_audit_logs_owner_only"
  on public.internal_growth_audit_logs
  for all
  using (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid()))
  with check (exists(select 1 from public.internal_growth_agent_admins a where a.user_id = auth.uid()));

-- TODO(phase2-extension): ingest GitHub PR/changelog signals into internal_growth_features.
-- TODO(phase2-extension): automate screenshot/video capture for discovered feature surfaces.
-- TODO(phase2-extension): add autonomous render generation worker for approved drafts.
-- TODO(phase2-extension): wire publish queue handoff after human approval.
-- TODO(phase2-extension): feed published performance analytics back into campaign scoring.
-- TODO(phase2-extension): add deterministic performance scoring engine for draft ranking.
