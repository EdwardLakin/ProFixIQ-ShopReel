import { createAdminClient } from "@/lib/supabase/server";

export async function getStorySourceWithAssets(input: {
  shopId: string;
  storySourceId: string;
}) {
  const supabase = createAdminClient();

  const { data: source, error: sourceError } = await supabase
    .from("shopreel_story_sources")
    .select("*")
    .eq("shop_id", input.shopId)
    .eq("id", input.storySourceId)
    .maybeSingle();

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  if (!source) {
    return null;
  }

  const [{ data: assets, error: assetsError }, { data: refs, error: refsError }] =
    await Promise.all([
      supabase
        .from("shopreel_story_source_assets")
        .select("*")
        .eq("shop_id", input.shopId)
        .eq("story_source_id", input.storySourceId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("shopreel_story_source_refs")
        .select("*")
        .eq("shop_id", input.shopId)
        .eq("story_source_id", input.storySourceId)
        .order("created_at", { ascending: true }),
    ]);

  if (assetsError) {
    throw new Error(assetsError.message);
  }

  if (refsError) {
    throw new Error(refsError.message);
  }

  return {
    source,
    assets: assets ?? [],
    refs: refs ?? [],
  };
}
