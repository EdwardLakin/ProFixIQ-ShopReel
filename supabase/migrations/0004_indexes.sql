create index if not exists idx_content_templates_tenant_shop_id
on public.content_templates(tenant_shop_id);
create index if not exists idx_content_calendars_tenant_shop_id on public.content_calendars (tenant_shop_id);
create index if not exists idx_content_assets_tenant_shop_id on public.content_assets (tenant_shop_id);
create index if not exists idx_content_assets_source_refs on public.content_assets (source_shop_id, source_vehicle_id, source_work_order_id, source_inspection_id);
create index if not exists idx_content_pieces_tenant_shop_id on public.content_pieces (tenant_shop_id);
create index if not exists idx_content_pieces_status on public.content_pieces (status);
create index if not exists idx_content_calendar_items_calendar_id on public.content_calendar_items (calendar_id);
create index if not exists idx_content_calendar_items_content_piece_id on public.content_calendar_items (content_piece_id);
create index if not exists idx_content_events_tenant_shop_id on public.content_events (tenant_shop_id);
create index if not exists idx_content_events_content_piece_id on public.content_events (content_piece_id);
create index if not exists idx_content_platform_accounts_tenant_shop_id on public.content_platform_accounts (tenant_shop_id);
create unique index if not exists idx_content_platform_accounts_unique_platform_account
  on public.content_platform_accounts (tenant_shop_id, platform, coalesce(platform_account_id, ''));
create index if not exists idx_content_publications_tenant_shop_id on public.content_publications (tenant_shop_id);
create index if not exists idx_content_publications_content_piece_id on public.content_publications (content_piece_id);
create index if not exists idx_content_publications_status on public.content_publications (status);
create index if not exists idx_content_analytics_events_tenant_shop_id on public.content_analytics_events (tenant_shop_id);
create index if not exists idx_content_analytics_events_publication_id on public.content_analytics_events (publication_id);
