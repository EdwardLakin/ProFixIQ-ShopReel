import { createAdminClient } from "@/lib/supabase/server";

type TrackMetricsInput = {
  shopId?: string;
  contentPieceId: string;
  platform: string;
  views?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  leads?: number;
  bookings?: number;
  revenue?: number;
  watchTimeSeconds?: number;
  avgWatchSeconds?: number;
};

type ContentPieceRow = {
  tenant_shop_id: string;
};

export async function trackMetrics(input: TrackMetricsInput) {
  const supabase = createAdminClient();

  let shopId = input.shopId ?? null;

  if (!shopId) {
    const { data: pieceData, error: pieceError } = await supabase
      .from("content_pieces")
      .select("tenant_shop_id")
      .eq("id", input.contentPieceId)
      .maybeSingle();

    if (pieceError) {
      throw new Error(pieceError.message);
    }

    const piece = (pieceData ?? null) as ContentPieceRow | null;
    shopId = piece?.tenant_shop_id ?? null;
  }

  if (!shopId) {
    throw new Error("Unable to resolve shopId for metric tracking");
  }

  const payload = {
    shop_id: shopId,
    video_id: input.contentPieceId,
    platform: input.platform,
    metric_date: new Date().toISOString().slice(0, 10),
    views: input.views ?? 0,
    impressions: input.impressions ?? 0,
    likes: input.likes ?? 0,
    comments: input.comments ?? 0,
    shares: input.shares ?? 0,
    saves: input.saves ?? 0,
    clicks: input.clicks ?? 0,
    leads: input.leads ?? 0,
    bookings: input.bookings ?? 0,
    revenue: input.revenue ?? 0,
    watch_time_seconds: input.watchTimeSeconds ?? 0,
    avg_watch_seconds: input.avgWatchSeconds ?? 0,
    meta: {
      source: "trackMetrics",
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("video_metrics")
    .upsert(payload as never, {
      onConflict: "video_id,platform,metric_date",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
