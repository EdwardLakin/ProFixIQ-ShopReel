import { NextResponse } from "next/server";
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

    const { data: scenes, error } = await supabase
      .from("shopreel_campaign_item_scenes")
      .select("id, media_job_id, campaign_item_id")
      .eq("campaign_id", id)
      .eq("shop_id", shopId)
      .order("scene_order", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const runResults: Array<{
      sceneId: string;
      mediaJobId: string;
      providerTaskId: string;
      ok: boolean;
    }> = [];

    for (const scene of scenes ?? []) {
      if (!scene.media_job_id) continue;

      const result = await launchPremiumRunwaySceneJob(scene.media_job_id);

      runResults.push({
        sceneId: scene.id,
        mediaJobId: result.mediaJobId,
        providerTaskId: result.providerTaskId,
        ok: true,
      });
    }

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
            : "Failed to run campaign scene jobs",
      },
      { status: 500 }
    );
  }
}
