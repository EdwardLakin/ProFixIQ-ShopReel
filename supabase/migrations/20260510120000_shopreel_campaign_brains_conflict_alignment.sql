-- Align upsert contract for campaign brain persistence to tenant-scoped uniqueness.
-- This fixes ON CONFLICT failures when the unique constraint is missing/misaligned.

create unique index if not exists shopreel_campaign_brains_shop_campaign_unique_idx
  on public.shopreel_campaign_brains(shop_id, campaign_id);
