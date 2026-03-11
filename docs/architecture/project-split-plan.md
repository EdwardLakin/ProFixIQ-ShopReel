# ShopReel / Pulse Supabase Split Plan

## Goal
Separate ShopReel content engine infrastructure from the shared ProFixIQ Supabase project.

## Project A (ProFixIQ)
Owns:
- shops / orgs
- customers
- vehicles
- inspections
- work orders
- media_uploads
- inspection_photos
- operational workflows

## Project B (ShopReel / future Pulse)
Owns:
- content_assets
- content_calendars
- content_calendar_items
- content_pieces
- content_events
- content_platform_accounts
- content_publications
- content_templates
- content_analytics_events

## Source reference contract
All ShopReel records reference ProFixIQ by UUID only:
- source_shop_id
- source_vehicle_id
- source_work_order_id
- source_inspection_id
- source_media_upload_id
- source_inspection_photo_id

No cross-project foreign keys.
