import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import ShopReelOpportunitiesClient from "@/features/shopreel/components/ShopReelOpportunitiesClient";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export default async function ShopReelOpportunitiesPage() {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: opportunities, error } = await supabase
    .from("shopreel_content_opportunities")
    .select(`
      *,
      story_source:shopreel_story_sources (
        id,
        title,
        description,
        kind,
        origin
      )
    `)
    .eq("shop_id", shopId)
    .in("status", ["ready", "new"])
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const normalized = (opportunities ?? []).map((row) => ({
    ...row,
    story_source: Array.isArray(row.story_source) ? row.story_source[0] ?? null : row.story_source,
  }));

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Opportunities"
      subtitle="Discover, score, generate, and move strong story candidates into editing and publishing."
    >
      <ShopReelNav />
      <ShopReelOpportunitiesClient opportunities={normalized} />
    </GlassShell>
  );
}
