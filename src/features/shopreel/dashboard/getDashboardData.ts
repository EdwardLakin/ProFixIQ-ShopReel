import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function getDashboardData() {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const [
    storySourcesRes,
    generationsRes,
    processingRes,
    readyToPublishRes,
    opportunitiesRes,
  ] = await Promise.all([
    supabase
      .from("shopreel_story_sources")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shopId),
    supabase
      .from("shopreel_story_generations")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shopId),
    supabase
      .from("shopreel_media_generation_jobs")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shopId)
      .in("status", ["queued", "processing"]),
    supabase
      .from("content_pieces")
      .select("id", { count: "exact", head: true })
      .eq("tenant_shop_id", shopId)
      .eq("status", "ready"),
    supabase
      .from("shopreel_content_opportunities")
      .select("id, score, status", { count: "exact" })
      .eq("shop_id", shopId)
      .in("status", ["ready", "new"]),
  ]);

  const opportunities = opportunitiesRes.data ?? [];
  const highScoreOpportunities = opportunities.filter((row) => Number(row.score ?? 0) >= 80).length;
  const readyOpportunities = opportunities.filter((row) => row.status === "ready").length;

  return {
    storySourcesCount: storySourcesRes.count ?? 0,
    generationsCount: generationsRes.count ?? 0,
    processingCount: processingRes.count ?? 0,
    readyToPublishCount: readyToPublishRes.count ?? 0,
    opportunitiesCount: opportunitiesRes.count ?? 0,
    highScoreOpportunities,
    readyOpportunities,
  };
}
