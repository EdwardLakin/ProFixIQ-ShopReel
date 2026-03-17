import { createAdminClient } from "@/lib/supabase/server";
import { getOptimizationSnapshot } from "./getOptimizationSnapshot";

type RankedCandidate = {
  contentPieceId: string;
  title: string | null;
  contentType: string | null;
  hook: string | null;
  predictedScore: number;
  reasons: string[];
};

function hookPatternBoost(hook: string | null) {
  if (!hook) return 0;

  let score = 0;
  const normalized = hook.toLowerCase();

  if (/\d/.test(normalized)) score += 8;
  if (normalized.includes("before")) score += 6;
  if (normalized.includes("after")) score += 6;
  if (normalized.includes("today")) score += 4;
  if (normalized.includes("found")) score += 5;
  if (normalized.length <= 80) score += 4;

  return score;
}

export async function buildPrePublishRanking(shopId: string) {
  const supabase = createAdminClient();
  const optimization = await getOptimizationSnapshot(shopId);

  const [{ data: pieces, error: piecesError }, { data: benchmarks, error: benchmarkError }] =
    await Promise.all([
      supabase
        .from("content_pieces")
        .select("id, title, content_type, hook, status")
        .eq("tenant_shop_id", shopId)
        .in("status", ["draft", "queued", "ready"])
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("global_content_benchmarks")
        .select("platform, content_type, avg_engagement_score, avg_views, total_posts")
        .eq("benchmark_window_days", 90),
    ]);

  if (piecesError) {
    throw new Error(piecesError.message);
  }

  if (benchmarkError) {
    throw new Error(benchmarkError.message);
  }

  const benchmarkByType = new Map<
    string,
    { avg_engagement_score: number; avg_views: number; total_posts: number }
  >();

  for (const row of (benchmarks ?? []) as Array<{
    platform: string;
    content_type: string;
    avg_engagement_score: number | null;
    avg_views: number | null;
    total_posts: number | null;
  }>) {
    const current = benchmarkByType.get(row.content_type) ?? {
      avg_engagement_score: 0,
      avg_views: 0,
      total_posts: 0,
    };

    current.avg_engagement_score = Math.max(
      current.avg_engagement_score,
      Number(row.avg_engagement_score ?? 0),
    );
    current.avg_views = Math.max(current.avg_views, Number(row.avg_views ?? 0));
    current.total_posts = Math.max(current.total_posts, Number(row.total_posts ?? 0));

    benchmarkByType.set(row.content_type, current);
  }

  const ranked: RankedCandidate[] = ((pieces ?? []) as Array<{
    id: string;
    title: string | null;
    content_type: string | null;
    hook: string | null;
    status: string | null;
  }>).map((piece) => {
    const contentType = piece.content_type ?? "unknown";
    const reasons: string[] = [];
    let predictedScore = 40;

    const boost = Number(optimization.contentTypeBoosts[contentType] ?? 0);
    predictedScore += boost;
    if (boost > 0) reasons.push(`Historical shop boost for ${contentType}`);

    const benchmark = benchmarkByType.get(contentType);
    if (benchmark) {
      if (benchmark.avg_engagement_score >= 0.12) {
        predictedScore += 18;
        reasons.push("Strong benchmark engagement");
      } else if (benchmark.avg_engagement_score >= 0.06) {
        predictedScore += 10;
        reasons.push("Healthy benchmark engagement");
      }

      if (benchmark.avg_views >= 5000) {
        predictedScore += 12;
        reasons.push("High benchmark view count");
      } else if (benchmark.avg_views >= 1000) {
        predictedScore += 6;
        reasons.push("Solid benchmark view count");
      }
    }

    const hookBoost = hookPatternBoost(piece.hook);
    predictedScore += hookBoost;
    if (hookBoost > 0) reasons.push("Hook matches winning patterns");

    if (
      optimization.preferredContentTypes.includes(contentType) &&
      optimization.preferredContentTypes.indexOf(contentType) < 3
    ) {
      predictedScore += 10;
      reasons.push("Top-performing shop content type");
    }

    return {
      contentPieceId: piece.id,
      title: piece.title,
      contentType: piece.content_type,
      hook: piece.hook,
      predictedScore: Math.min(100, predictedScore),
      reasons,
    };
  });

  ranked.sort((a, b) => b.predictedScore - a.predictedScore);

  await supabase
    .from("shop_marketing_memory")
    .upsert(
      {
        shop_id: shopId,
        memory_key: "pre_publish_ranking",
        memory_value: {
          updatedAt: new Date().toISOString(),
          items: ranked.slice(0, 20),
        },
        source_type: "predictive_ranking",
        confidence: 0.82,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "shop_id,memory_key" },
    );

  return ranked;
}
