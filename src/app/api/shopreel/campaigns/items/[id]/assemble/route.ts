import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

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
      .select("id, campaign_id, shop_id, final_output_asset_id")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (itemError || !item) {
      throw new Error(itemError?.message ?? "Campaign item not found");
    }

    const { data: scenes, error: scenesError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .select("id, status, output_asset_id")
      .eq("campaign_item_id", item.id)
      .eq("shop_id", shopId);

    if (scenesError) {
      throw new Error(scenesError.message);
    }

    if (!scenes || scenes.length === 0) {
      throw new Error("No scenes available to assemble");
    }

    const incomplete = scenes.filter(
      (scene) => scene.status !== "completed" || !scene.output_asset_id
    );

    if (incomplete.length > 0) {
      throw new Error("All scene videos must be completed before assembly");
    }

    const payload = {
      shop_id: shopId,
      campaign_id: item.campaign_id,
      campaign_item_id: item.id,
      status: "queued",
      run_after: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
      started_at: null,
      completed_at: null,
      error_text: null,
      settings: {},
      result_payload: {}
    };

    const { data: job, error: upsertError } = await supabase
      .from("shopreel_premium_assembly_jobs")
      .upsert(payload, { onConflict: "campaign_item_id" })
      .select("id, status")
      .single();

    if (upsertError || !job) {
      throw new Error(upsertError?.message ?? "Failed to enqueue premium assembly job");
    }

    revalidatePath(`/shopreel/campaigns/${item.campaign_id}`);
    revalidatePath(`/shopreel/campaigns/items/${item.id}`);

    return NextResponse.json({
      ok: true,
      queued: true,
      jobId: job.id,
      status: job.status
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to enqueue premium campaign item"
      },
      { status: 500 }
    );
  }
}
