import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { launchPremiumRunwaySceneJob } from "@/features/shopreel/campaigns/lib/premiumRunway";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();

    const { data: item, error: itemError } = await supabase
      .from("shopreel_campaign_items")
      .select("id, campaign_id")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (itemError || !item) {
      throw new Error(itemError?.message ?? "Campaign item not found");
    }

    const { data: scenes, error } = await supabase
      .from("shopreel_campaign_item_scenes")
      .select("id, media_job_id")
      .eq("campaign_item_id", id)
      .eq("shop_id", shopId)
      .order("scene_order", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const runResults = [];

    for (const scene of scenes ?? []) {
      if (!scene.media_job_id) continue;

      const result = await launchPremiumRunwaySceneJob(scene.media_job_id);

      runResults.push({
        sceneId: scene.id,
        mediaJobId: scene.media_job_id,
        providerTaskId: result.providerTaskId,
        ok: true,
      });
    }

    revalidatePath(`/shopreel/campaigns/${item.campaign_id}`);
    revalidatePath(`/shopreel/campaigns/items/${item.id}`);

    return NextResponse.json({
      ok: true,
      runResults,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run premium scene jobs",
      },
      { status: 500 }
    );
  }
}
