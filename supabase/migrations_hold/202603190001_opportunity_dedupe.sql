-- Prevent duplicate opportunities per story source

create unique index if not exists
shopreel_opportunity_source_unique
on public.shopreel_content_opportunities (shop_id, story_source_id);
