import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ seriesKey: string }> }
) {
  try {
    const { seriesKey } = await ctx.params;
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();

    const { data: jobs, error: jobsError } = await supabase
      .from("shopreel_media_generation_jobs")
      .select("id")
      .eq("shop_id", shopId)
      .contains("settings", { series_key: seriesKey });

    if (jobsError) {
      throw new Error(jobsError.message);
    }

    const jobIds = (jobs ?? []).map((job) => job.id);

    if (jobIds.length === 0) {
      throw new Error("Series not found");
    }

    const { error: sceneUpdateError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .update({
        media_job_id: null,
        output_asset_id: null,
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .in("media_job_id", jobIds)
      .eq("shop_id", shopId);

    if (sceneUpdateError) {
      throw new Error(sceneUpdateError.message);
    }

    const { error: itemUpdateError } = await supabase
      .from("shopreel_campaign_items")
      .update({
        media_job_id: null,
        updated_at: new Date().toISOString(),
      })
      .in("media_job_id", jobIds)
      .eq("shop_id", shopId);

    if (itemUpdateError) {
      throw new Error(itemUpdateError.message);
    }

    const { error: storyboardSceneError } = await supabase
      .from("shopreel_storyboard_scenes")
      .delete()
      .in("generated_job_id", jobIds)
      .eq("shop_id", shopId);

    if (storyboardSceneError) {
      throw new Error(storyboardSceneError.message);
    }

    const { error: storyboardError } = await supabase
      .from("shopreel_storyboards")
      .delete()
      .in("source_generation_job_id", jobIds)
      .eq("shop_id", shopId);

    if (storyboardError) {
      throw new Error(storyboardError.message);
    }

    const { error: deleteError } = await supabase
      .from("shopreel_media_generation_jobs")
      .delete()
      .in("id", jobIds)
      .eq("shop_id", shopId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    revalidatePath("/shopreel/video-creation");
    revalidatePath(`/shopreel/video-creation/series/${seriesKey}`);

    return NextResponse.json({
      ok: true,
      deletedCount: jobIds.length,
      seriesKey,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to delete series",
      },
      { status: 500 }
    );
  }
}
