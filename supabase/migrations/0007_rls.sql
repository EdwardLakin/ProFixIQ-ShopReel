alter table public.source_shop_links enable row level security;
alter table public.content_templates enable row level security;
alter table public.content_calendars enable row level security;
alter table public.content_assets enable row level security;
alter table public.content_pieces enable row level security;
alter table public.content_calendar_items enable row level security;
alter table public.content_events enable row level security;
alter table public.content_platform_accounts enable row level security;
alter table public.content_publications enable row level security;
alter table public.content_analytics_events enable row level security;

drop policy if exists source_shop_links_select on public.source_shop_links;
create policy source_shop_links_select
on public.source_shop_links
for select
using (tenant_shop_id = public.current_tenant_shop_id());

drop policy if exists content_templates_all on public.content_templates;
create policy content_templates_all
on public.content_templates
for all
using (tenant_shop_id = public.current_tenant_shop_id())
with check (tenant_shop_id = public.current_tenant_shop_id());

drop policy if exists content_calendars_all on public.content_calendars;
create policy content_calendars_all
on public.content_calendars
for all
using (tenant_shop_id = public.current_tenant_shop_id())
with check (tenant_shop_id = public.current_tenant_shop_id());

drop policy if exists content_assets_all on public.content_assets;
create policy content_assets_all
on public.content_assets
for all
using (tenant_shop_id = public.current_tenant_shop_id())
with check (tenant_shop_id = public.current_tenant_shop_id());

drop policy if exists content_pieces_all on public.content_pieces;
create policy content_pieces_all
on public.content_pieces
for all
using (tenant_shop_id = public.current_tenant_shop_id())
with check (tenant_shop_id = public.current_tenant_shop_id());

drop policy if exists content_calendar_items_all on public.content_calendar_items;
create policy content_calendar_items_all
on public.content_calendar_items
for all
using (tenant_shop_id = public.current_tenant_shop_id())
with check (tenant_shop_id = public.current_tenant_shop_id());

drop policy if exists content_events_all on public.content_events;
create policy content_events_all
on public.content_events
for all
using (tenant_shop_id = public.current_tenant_shop_id())
with check (tenant_shop_id = public.current_tenant_shop_id());

drop policy if exists content_platform_accounts_all on public.content_platform_accounts;
create policy content_platform_accounts_all
on public.content_platform_accounts
for all
using (tenant_shop_id = public.current_tenant_shop_id())
with check (tenant_shop_id = public.current_tenant_shop_id());

drop policy if exists content_publications_all on public.content_publications;
create policy content_publications_all
on public.content_publications
for all
using (tenant_shop_id = public.current_tenant_shop_id())
with check (tenant_shop_id = public.current_tenant_shop_id());

drop policy if exists content_analytics_events_all on public.content_analytics_events;
create policy content_analytics_events_all
on public.content_analytics_events
for all
using (tenant_shop_id = public.current_tenant_shop_id())
with check (tenant_shop_id = public.current_tenant_shop_id());
