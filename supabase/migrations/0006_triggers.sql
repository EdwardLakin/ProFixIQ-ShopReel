drop trigger if exists trg_content_templates_set_updated_at on public.content_templates;
create trigger trg_content_templates_set_updated_at
before update on public.content_templates
for each row execute function public.set_updated_at();

drop trigger if exists trg_content_calendars_set_updated_at on public.content_calendars;
create trigger trg_content_calendars_set_updated_at
before update on public.content_calendars
for each row execute function public.set_updated_at();

drop trigger if exists trg_content_assets_set_updated_at on public.content_assets;
create trigger trg_content_assets_set_updated_at
before update on public.content_assets
for each row execute function public.set_updated_at();

drop trigger if exists trg_content_pieces_set_updated_at on public.content_pieces;
create trigger trg_content_pieces_set_updated_at
before update on public.content_pieces
for each row execute function public.set_updated_at();

drop trigger if exists trg_content_calendar_items_set_updated_at on public.content_calendar_items;
create trigger trg_content_calendar_items_set_updated_at
before update on public.content_calendar_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_content_platform_accounts_set_updated_at on public.content_platform_accounts;
create trigger trg_content_platform_accounts_set_updated_at
before update on public.content_platform_accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_content_publications_set_updated_at on public.content_publications;
create trigger trg_content_publications_set_updated_at
before update on public.content_publications
for each row execute function public.set_updated_at();
