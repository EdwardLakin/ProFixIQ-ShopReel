-- Allow standalone ShopReel manual creation without requiring a ProFixIQ shop.
-- Standalone manual records are owned by auth.uid()/created_by.
-- Shop-connected records can still carry shop_id for future connected workflows.

alter table public.shopreel_manual_assets
  alter column shop_id drop not null;

alter table public.shopreel_manual_asset_files
  alter column shop_id drop not null;

alter table public.shopreel_story_sources
  alter column shop_id drop not null;

alter table public.shopreel_story_generations
  alter column shop_id drop not null;

drop policy if exists shopreel_manual_assets_all on public.shopreel_manual_assets;
create policy shopreel_manual_assets_all
on public.shopreel_manual_assets
for all
using (
  created_by = auth.uid()
  or shop_id::text = auth.jwt() ->> 'shop_id'
)
with check (
  created_by = auth.uid()
  or shop_id::text = auth.jwt() ->> 'shop_id'
);

drop policy if exists shopreel_manual_asset_files_all on public.shopreel_manual_asset_files;
create policy shopreel_manual_asset_files_all
on public.shopreel_manual_asset_files
for all
using (
  exists (
    select 1
    from public.shopreel_manual_assets asset
    where asset.id = shopreel_manual_asset_files.asset_id
      and (
        asset.created_by = auth.uid()
        or asset.shop_id::text = auth.jwt() ->> 'shop_id'
      )
  )
)
with check (
  exists (
    select 1
    from public.shopreel_manual_assets asset
    where asset.id = shopreel_manual_asset_files.asset_id
      and (
        asset.created_by = auth.uid()
        or asset.shop_id::text = auth.jwt() ->> 'shop_id'
      )
  )
);
