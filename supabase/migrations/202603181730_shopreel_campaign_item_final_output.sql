alter table public.shopreel_campaign_items
add column if not exists final_output_asset_id uuid null references public.content_assets(id);

create index if not exists idx_shopreel_campaign_items_final_output_asset_id
  on public.shopreel_campaign_items(final_output_asset_id);
