import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { getBaseUrl } from "@/features/shopreel/lib/getBaseUrl";

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

      const res = await fetch(
        `${baseUrl}/api/shopreel/video-creation/jobs/${scene.media_job_id}/run`,
        { method: "POST" }
      );

      runResults.push({
        sceneId: scene.id,
        mediaJobId: scene.media_job_id,
        ok: res.ok,
        status: res.status,
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
            : "Failed to run scene jobs",
      },
      { status: 500 }
    );
  }
}
