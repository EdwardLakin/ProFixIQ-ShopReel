-- =========================================
-- SHOPREEL MOAT TABLES / VIEWS
-- Safe for existing schema
-- =========================================

-- =========================================
-- PUBLICATIONS
-- =========================================

create table if not exists video_publications (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete cascade,
  platform text,
  platform_video_id text,
  status text,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- =========================================
-- SHOP LEARNING SIGNALS
-- =========================================

create table if not exists shop_content_signals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  content_type text not null,
  avg_engagement_score numeric,
  total_views integer,
  total_leads integer,
  posts_generated integer,
  last_updated timestamptz default now()
);

-- =========================================
-- DROP OLD VIEW (required to change columns)
-- =========================================

drop view if exists v_top_content_types_by_shop;

-- =========================================
-- CONTENT PERFORMANCE VIEW
-- =========================================

create view v_top_content_types_by_shop as
select
  v.shop_id,
  v.content_type,

  avg(
    case
      when coalesce(vm.views,0) > 0 then
        (
          coalesce(vm.likes,0)
          + (coalesce(vm.comments,0) * 2)
          + (coalesce(vm.shares,0) * 3)
          + (coalesce(vm.saves,0) * 2)
          + (coalesce(vm.clicks,0) * 4)
          + (coalesce(vm.leads,0) * 8)
          + (coalesce(vm.bookings,0) * 10)
        )::numeric / nullif(vm.views,0)
      else 0
    end
  ) as avg_engagement_score,

  coalesce(sum(vm.views),0)::integer as total_views,
  coalesce(sum(vm.leads),0)::integer as total_leads,
  count(distinct v.id)::integer as posts_generated,
  max(vm.updated_at) as last_updated

from videos v
left join video_metrics vm
  on vm.video_id = v.id

group by v.shop_id, v.content_type;