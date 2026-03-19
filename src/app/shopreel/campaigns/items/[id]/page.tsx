export const dynamic = "force-dynamic";
export const revalidate = 0;

import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import CampaignItemClient from "@/features/shopreel/campaigns/components/CampaignItemClient";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export default async function ShopReelCampaignItemPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: item, error: itemError } = await supabase
    .from("shopreel_campaign_items")
    .select("*, final_output_asset_id")
    .eq("id", id)
    .eq("shop_id", shopId)
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Campaign item not found");
  }

  const { data: scenes, error: scenesError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select(`
      *,
      media_job:shopreel_media_generation_jobs (
        id,
        status,
        output_asset_id,
        preview_url,
        provider,
        provider_job_id,
        error_text
      )
    `)
    .eq("campaign_item_id", item.id)
    .eq("shop_id", shopId)
    .order("scene_order", { ascending: true });

  if (scenesError) {
    throw new Error(scenesError.message);
  }

  const normalizedScenes = (scenes ?? []).map((scene) => ({
    ...scene,
    media_job: Array.isArray(scene.media_job)
      ? scene.media_job[0] ?? null
      : scene.media_job,
  }));

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Campaign Item"
      subtitle="Run, monitor, and assemble this item into a final multi-scene ad."
    >
      <ShopReelNav />
      <CampaignItemClient item={item} scenes={normalizedScenes} />
    </GlassShell>
  );
}
