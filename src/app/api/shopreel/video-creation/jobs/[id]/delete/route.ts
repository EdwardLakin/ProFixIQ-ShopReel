import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();

    const { data: job, error: jobError } = await supabase
      .from("shopreel_media_generation_jobs")
      .select("id, shop_id, output_asset_id")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (jobError || !job) {
      throw new Error(jobError?.message ?? "Media job not found");
    }

    const { error: sceneUpdateError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .update({
        media_job_id: null,
        output_asset_id: null,
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("media_job_id", job.id)
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
      .eq("media_job_id", job.id)
      .eq("shop_id", shopId);

    if (itemUpdateError) {
      throw new Error(itemUpdateError.message);
    }

    const { error: storyboardSceneError } = await supabase
      .from("shopreel_storyboard_scenes")
      .delete()
      .eq("generated_job_id", job.id)
      .eq("shop_id", shopId);

    if (storyboardSceneError) {
      throw new Error(storyboardSceneError.message);
    }

    const { error: storyboardError } = await supabase
      .from("shopreel_storyboards")
      .delete()
      .eq("source_generation_job_id", job.id)
      .eq("shop_id", shopId);

    if (storyboardError) {
      throw new Error(storyboardError.message);
    }

    const { error: deleteError } = await supabase
      .from("shopreel_media_generation_jobs")
      .delete()
      .eq("id", job.id)
      .eq("shop_id", shopId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    revalidatePath("/shopreel/video-creation");

    return NextResponse.json({
      ok: true,
      deletedId: job.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to delete media job",
      },
      { status: 500 }
    );
  }
}
