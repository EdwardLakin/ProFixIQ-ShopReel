import { NextResponse } from "next/server";
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
      .select("id, campaign_id, shop_id")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (itemError || !item) {
      throw new Error(itemError?.message ?? "Campaign item not found");
    }

    await supabase
      .from("shopreel_campaign_item_scenes")
      .update({
        media_job_id: null,
        output_asset_id: null,
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("campaign_item_id", id)
      .eq("shop_id", shopId);

    const { data: jobs } = await supabase
      .from("shopreel_media_generation_jobs")
      .select("id, settings")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    const resetJobIds =
      (jobs ?? [])
        .filter((job) => {
          const settings =
            job.settings && typeof job.settings === "object" && !Array.isArray(job.settings)
              ? (job.settings as Record<string, unknown>)
              : null;
          return settings?.campaign_item_id === id;
        })
        .map((job) => job.id);

    if (resetJobIds.length > 0) {
      await supabase
        .from("shopreel_media_generation_jobs")
        .delete()
        .in("id", resetJobIds)
        .eq("shop_id", shopId);
    }

    return NextResponse.json({
      ok: true,
      resetJobIds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to reset item",
      },
      { status: 500 }
    );
  }
}
