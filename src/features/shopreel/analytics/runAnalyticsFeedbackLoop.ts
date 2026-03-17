import { createAdminClient } from "@/lib/supabase/server";
import { analyzePerformance } from "./analyzePerformance";
import { updateMarketingMemory } from "@/features/shopreel/memory/updateMarketingMemory";
import { updateLearningSignals } from "@/features/shopreel/learning/updateLearningSignals";
import { syncPlatformMetrics } from "./syncPlatformMetrics";
import { updateGlobalBenchmarks } from "@/features/shopreel/optimization/updateGlobalBenchmarks";
import { mutatePromptStrategy } from "@/features/shopreel/optimization/mutatePromptStrategy";
import { buildPrePublishRanking } from "@/features/shopreel/optimization/buildPrePublishRanking";

type PublicationRow = {
  id: string;
  tenant_shop_id: string;
  content_piece_id: string | null;
  platform: string | null;
  published_at: string | null;
};

export async function runAnalyticsFeedbackLoop(shopId: string) {
  const supabase = createAdminClient();

  const { data: publications, error: publicationsError } = await supabase
    .from("content_publications")
    .select("id, tenant_shop_id, content_piece_id, platform, published_at")
    .eq("tenant_shop_id", shopId)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(100);

  if (publicationsError) {
    throw new Error(publicationsError.message);
  }

  const publishedRows = (publications ?? []) as PublicationRow[];

  const analyticsRows = publishedRows
    .filter(
      (row): row is PublicationRow & { content_piece_id: string; platform: string } =>
        typeof row.content_piece_id === "string" &&
        row.content_piece_id.length > 0 &&
        typeof row.platform === "string" &&
        row.platform.length > 0,
    )
    .map((row) => ({
      tenant_shop_id: shopId,
      source_shop_id: shopId,
      source_system: "shopreel",
      publication_id: row.id,
      content_piece_id: row.content_piece_id,
      platform: row.platform as
        | "instagram"
        | "facebook"
        | "tiktok"
        | "youtube"
        | "blog"
        | "linkedin"
        | "google_business"
        | "email",
      event_name: "published",
      event_value: 1,
      occurred_at: row.published_at ?? new Date().toISOString(),
      payload: {
        publication_id: row.id,
        source: "runAnalyticsFeedbackLoop",
      },
    }));

  if (analyticsRows.length > 0) {
    const { error: analyticsError } = await supabase
      .from("content_analytics_events")
      .insert(analyticsRows as never);

    if (analyticsError && !analyticsError.message.toLowerCase().includes("duplicate")) {
      throw new Error(analyticsError.message);
    }
  }

  const [syncedMetrics, ranking, memory, signals, benchmarks, promptStrategy, prePublishRanking] =
    await Promise.all([
      syncPlatformMetrics(shopId),
      analyzePerformance(shopId),
      updateMarketingMemory(shopId),
      updateLearningSignals(shopId),
      updateGlobalBenchmarks(),
      mutatePromptStrategy(shopId),
      buildPrePublishRanking(shopId),
    ]);

  const snapshot = {
    updatedAt: new Date().toISOString(),
    ranking: ranking ?? [],
    publicationCount: publishedRows.length,
    syncedMetrics,
    benchmarks,
    promptStrategy,
    prePublishRankingTop: prePublishRanking.slice(0, 10),
    signalCount:
      signals && typeof signals === "object" && "count" in signals
        ? Number((signals as { count?: number }).count ?? 0)
        : 0,
  };

  const { error: memoryError } = await supabase
    .from("shop_marketing_memory")
    .upsert(
      {
        shop_id: shopId,
        memory_key: "automation_loop_snapshot",
        memory_value: snapshot,
        source_type: "automation_loop",
        confidence: 0.94,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "shop_id,memory_key" },
    );

  if (memoryError) {
    throw new Error(memoryError.message);
  }

  return {
    ok: true,
    shopId,
    ranking: ranking ?? [],
    memory,
    signals,
    snapshot,
    syncedMetrics,
    benchmarks,
    promptStrategy,
    prePublishRanking,
  };
}
