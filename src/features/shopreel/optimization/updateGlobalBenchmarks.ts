import { createAdminClient } from "@/lib/supabase/server";

type AggregateRow = {
  platform: string | null;
  content_type: string | null;
  avg_engagement_score: number | null;
  avg_views: number | null;
  avg_impressions: number | null;
  total_posts: number | null;
};

export async function updateGlobalBenchmarks() {
  const supabase = createAdminClient();

  const since = new Date(Date.now() - 90 * 86400000).toISOString();

  const { data: publications, error: publicationsError } = await supabase
    .from("content_publications")
    .select("platform, content_piece_id, tenant_shop_id")
    .not("published_at", "is", null)
    .gte("published_at", since);

  if (publicationsError) {
    throw new Error(publicationsError.message);
  }

  const publicationRows = (publications ?? []) as Array<{
    platform: string | null;
    content_piece_id: string | null;
    tenant_shop_id: string;
  }>;

  const contentPieceIds = publicationRows
    .map((row) => row.content_piece_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (contentPieceIds.length === 0) {
    return { ok: true, rows: 0 };
  }

  const { data: pieces, error: piecesError } = await supabase
    .from("content_pieces")
    .select("id, content_type")
    .in("id", contentPieceIds);

  if (piecesError) {
    throw new Error(piecesError.message);
  }

  const pieceTypeById = new Map<string, string>();
  for (const row of (pieces ?? []) as Array<{ id: string; content_type: string | null }>) {
    if (typeof row.content_type === "string" && row.content_type.length > 0) {
      pieceTypeById.set(row.id, row.content_type);
    }
  }

  const { data: metrics, error: metricsError } = await supabase
    .from("video_metrics")
    .select("video_id, platform, views, impressions, likes, comments, shares, saves, clicks")
    .gte("metric_date", since.slice(0, 10));

  if (metricsError) {
    throw new Error(metricsError.message);
  }

  const bucket = new Map<
    string,
    {
      platform: string;
      content_type: string;
      engagementTotal: number;
      viewsTotal: number;
      impressionsTotal: number;
      count: number;
    }
  >();

  for (const row of (metrics ?? []) as Array<{
    video_id: string;
    platform: string;
    views: number | null;
    impressions: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    saves: number | null;
    clicks: number | null;
  }>) {
    const contentType = pieceTypeById.get(row.video_id);
    if (!contentType) continue;

    const platform = row.platform;
    const views = Number(row.views ?? 0);
    const impressions = Number(row.impressions ?? 0);
    const likes = Number(row.likes ?? 0);
    const comments = Number(row.comments ?? 0);
    const shares = Number(row.shares ?? 0);
    const saves = Number(row.saves ?? 0);
    const clicks = Number(row.clicks ?? 0);

    const engagement =
      impressions > 0
        ? (likes + comments * 2 + shares * 3 + saves * 2 + clicks * 4) / Math.max(impressions, 1)
        : 0;

    const key = `${platform}:${contentType}`;

    const existing = bucket.get(key) ?? {
      platform,
      content_type: contentType,
      engagementTotal: 0,
      viewsTotal: 0,
      impressionsTotal: 0,
      count: 0,
    };

    existing.engagementTotal += engagement;
    existing.viewsTotal += views;
    existing.impressionsTotal += impressions;
    existing.count += 1;

    bucket.set(key, existing);
  }

  const rows = Array.from(bucket.values()).map((row) => ({
    platform: row.platform,
    content_type: row.content_type,
    avg_engagement_score: Number((row.engagementTotal / Math.max(row.count, 1)).toFixed(4)),
    avg_views: Number((row.viewsTotal / Math.max(row.count, 1)).toFixed(2)),
    avg_impressions: Number((row.impressionsTotal / Math.max(row.count, 1)).toFixed(2)),
    total_posts: row.count,
    benchmark_window_days: 90,
    metadata: {
      source: "updateGlobalBenchmarks",
      updated_at: new Date().toISOString(),
    },
  }));

  if (rows.length === 0) {
    return { ok: true, rows: 0 };
  }

  const { error: upsertError } = await supabase
    .from("global_content_benchmarks")
    .upsert(rows as never, {
      onConflict: "platform,content_type,benchmark_window_days",
    });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return {
    ok: true,
    rows: rows.length,
  };
}
