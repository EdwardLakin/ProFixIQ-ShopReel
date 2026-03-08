import { createAdminClient } from "@/lib/supabase/server";

type TrackMetricsInput = {
  videoId: string;
  platform: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  leads?: number;
  bookings?: number;
};

export async function trackMetrics(input: TrackMetricsInput) {
  const supabase = createAdminClient();

  const views = input.views ?? 0;
  const likes = input.likes ?? 0;
  const comments = input.comments ?? 0;
  const shares = input.shares ?? 0;
  const saves = input.saves ?? 0;
  const clicks = input.clicks ?? 0;
  const leads = input.leads ?? 0;
  const bookings = input.bookings ?? 0;

  const engagementScore =
    views > 0
      ? Number(
          (
            (likes +
              comments * 2 +
              shares * 3 +
              saves * 2 +
              clicks * 4 +
              leads * 8 +
              bookings * 10) /
            views
          ).toFixed(4),
        )
      : 0;

  const insertPayload = {
    video_id: input.videoId,
    platform: input.platform,
    views,
    likes,
    comments,
    shares,
    saves,
    clicks,
    leads,
    bookings,
    engagement_score: engagementScore,
  };

  const { data, error } = await supabase
    .from("video_metrics")
    .insert(insertPayload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
