create or replace function public.record_video_metric(
  p_shop_id uuid,
  p_video_id uuid,
  p_platform text,
  p_metric_date date,
  p_impressions integer default 0,
  p_views integer default 0,
  p_watch_time_seconds numeric default 0,
  p_avg_watch_seconds numeric default 0,
  p_likes integer default 0,
  p_comments integer default 0,
  p_shares integer default 0,
  p_saves integer default 0,
  p_clicks integer default 0,
  p_leads integer default 0,
  p_bookings integer default 0,
  p_revenue numeric default 0,
  p_meta jsonb default '{}'::jsonb
)
returns public.video_metrics
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.video_metrics;
begin
  insert into public.video_metrics (
    shop_id,
    video_id,
    platform,
    metric_date,
    impressions,
    views,
    watch_time_seconds,
    avg_watch_seconds,
    likes,
    comments,
    shares,
    saves,
    clicks,
    leads,
    bookings,
    revenue,
    meta
  )
  values (
    p_shop_id,
    p_video_id,
    p_platform,
    p_metric_date,
    coalesce(p_impressions, 0),
    coalesce(p_views, 0),
    coalesce(p_watch_time_seconds, 0),
    coalesce(p_avg_watch_seconds, 0),
    coalesce(p_likes, 0),
    coalesce(p_comments, 0),
    coalesce(p_shares, 0),
    coalesce(p_saves, 0),
    coalesce(p_clicks, 0),
    coalesce(p_leads, 0),
    coalesce(p_bookings, 0),
    coalesce(p_revenue, 0),
    coalesce(p_meta, '{}'::jsonb)
  )
  on conflict (video_id, platform, metric_date)
  do update set
    impressions = excluded.impressions,
    views = excluded.views,
    watch_time_seconds = excluded.watch_time_seconds,
    avg_watch_seconds = excluded.avg_watch_seconds,
    likes = excluded.likes,
    comments = excluded.comments,
    shares = excluded.shares,
    saves = excluded.saves,
    clicks = excluded.clicks,
    leads = excluded.leads,
    bookings = excluded.bookings,
    revenue = excluded.revenue,
    meta = excluded.meta,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.record_video_metric(
  uuid,
  uuid,
  text,
  date,
  integer,
  integer,
  numeric,
  numeric,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  numeric,
  jsonb
) to authenticated;