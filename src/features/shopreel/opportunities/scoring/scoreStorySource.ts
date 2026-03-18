import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type DB = Database;

export async function scoreStorySource(
  supabase: SupabaseClient<DB>,
  shopId: string,
  storySourceId: string
): Promise<number> {
  let score = 0;

  const { data: source } = await supabase
    .from("shopreel_story_sources")
    .select("created_at, kind, metadata")
    .eq("id", storySourceId)
    .eq("shop_id", shopId)
    .single();

  if (source?.created_at) {
    const ageHours =
      (Date.now() - new Date(source.created_at).getTime()) / 3600000;
    const freshness = Math.max(0, 48 - ageHours) / 48;
    score += freshness * 40;
  }

  const { count: assetCount } = await supabase
    .from("shopreel_story_source_assets")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .eq("story_source_id", storySourceId);

  if (assetCount) {
    score += Math.min(assetCount * 10, 30);
  }

  const { count: generationCount } = await supabase
    .from("shopreel_story_generations")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .eq("story_source_id", storySourceId);

  if (!generationCount) {
    score += 20;
  }

  if (source?.kind === "manual_upload" || source?.kind === "before_after") {
    score += 10;
  }

  return Math.round(score);
}
