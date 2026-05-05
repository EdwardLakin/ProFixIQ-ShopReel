import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelOpportunitiesClient from "@/features/shopreel/components/ShopReelOpportunitiesClient";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { getOpportunityStatusesForTab } from "@/features/shopreel/opportunities/lib/status";

export default async function ShopReelOpportunitiesPage(props: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const status = searchParams.status ?? "active";

  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const allowedStatuses = getOpportunityStatusesForTab(status);

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
    .in("status", allowedStatuses)
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
      title="Ideas"
      subtitle="Discover, score, generate, and move strong story candidates into campaigns and publishing."
    >
      <ShopReelOpportunitiesClient opportunities={normalized} activeTab={status} />
    </GlassShell>
  );
}
