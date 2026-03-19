import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { getBaseUrl } from "@/features/shopreel/lib/getBaseUrl";
import { refreshCampaignItemSceneStatuses } from "@/features/shopreel/campaigns/lib/sceneStatus";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();
    const baseUrl = getBaseUrl();

    const { data: scenes, error } = await supabase
      .from("shopreel_campaign_item_scenes")
      .select(`
        id,
        media_job_id,
        media_job:shopreel_media_generation_jobs (
          id,
          status,
          output_asset_id
        )
      `)
      .eq("campaign_item_id", id)
      .eq("shop_id", shopId)
      .order("scene_order", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const syncResults = [];

    for (const scene of scenes ?? []) {
      const mediaJob = Array.isArray(scene.media_job)
        ? scene.media_job[0] ?? null
        : scene.media_job;

      if (!mediaJob?.id) continue;

      if (mediaJob.status === "processing") {
        const res = await fetch(
          `${baseUrl}/api/shopreel/video-creation/jobs/${mediaJob.id}/sync`,
          { method: "POST" }
        );

        syncResults.push({
          sceneId: scene.id,
          mediaJobId: mediaJob.id,
          ok: res.ok,
          status: res.status,
        });
      }
    }

    await refreshCampaignItemSceneStatuses(id);

    return NextResponse.json({
      ok: true,
      syncResults,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync scene jobs",
      },
      { status: 500 }
    );
  }
}
