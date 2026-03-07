create or replace view public.v_video_performance_summary as
select
  v.id as video_id,
  v.shop_id,
  v.content_type,
  v.title,
  v.status,
  count(distinct vpp.id) as platform_posts_count,
  coalesce(sum(vm.impressions), 0) as impressions,
  coalesce(sum(vm.views), 0) as views,
  coalesce(sum(vm.likes), 0) as likes,
  coalesce(sum(vm.comments), 0) as comments,
  coalesce(sum(vm.shares), 0) as shares,
  coalesce(sum(vm.saves), 0) as saves,
  coalesce(sum(vm.clicks), 0) as clicks,
  coalesce(sum(vm.leads), 0) as leads,
  coalesce(sum(vm.bookings), 0) as bookings,
  coalesce(sum(vm.revenue), 0) as revenue,
  case
    when coalesce(sum(vm.views), 0) = 0 then 0
    else round(
      (
        (coalesce(sum(vm.likes), 0) * 1.0) +
        (coalesce(sum(vm.comments), 0) * 2.0) +
        (coalesce(sum(vm.shares), 0) * 3.0) +
        (coalesce(sum(vm.saves), 0) * 2.0) +
        (coalesce(sum(vm.clicks), 0) * 4.0) +
        (coalesce(sum(vm.leads), 0) * 8.0) +
        (coalesce(sum(vm.bookings), 0) * 10.0)
      ) / greatest(sum(vm.views), 1),
      4
    )
  end as engagement_score
from public.videos v
left join public.video_platform_posts vpp
  on vpp.video_id = v.id
left join public.video_metrics vm
  on vm.video_id = v.id
group by v.id, v.shop_id, v.content_type, v.title, v.status;

create or replace view public.v_top_content_types_by_shop as
select
  shop_id,
  content_type,
  count(*) as videos_count,
  avg(engagement_score) as avg_engagement_score,
  sum(views) as total_views,
  sum(leads) as total_leads,
  sum(bookings) as total_bookings
from public.v_video_performance_summary
group by shop_id, content_type;