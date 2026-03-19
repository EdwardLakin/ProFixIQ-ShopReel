import { NextResponse } from "next/server";
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

    const { data: item, error: itemError } = await supabase
      .from("shopreel_campaign_items")
      .select("id, shop_id")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (itemError || !item) {
      throw new Error(itemError?.message ?? "Campaign item not found");
    }

    const { data: jobs } = await supabase
      .from("shopreel_media_generation_jobs")
      .select("id, settings")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    const deleteJobIds =
      (jobs ?? [])
        .filter((job) => {
          const settings =
            job.settings &&
            typeof job.settings === "object" &&
            !Array.isArray(job.settings)
              ? (job.settings as Record<string, unknown>)
              : null;

          return settings?.campaign_item_id === id;
        })
        .map((job) => job.id);

    if (deleteJobIds.length > 0) {
      await supabase
        .from("shopreel_media_generation_jobs")
        .delete()
        .in("id", deleteJobIds)
        .eq("shop_id", shopId);
    }

    await supabase
      .from("shopreel_campaign_item_scenes")
      .delete()
      .eq("campaign_item_id", id)
      .eq("shop_id", shopId);

    const { error: deleteItemError } = await supabase
      .from("shopreel_campaign_items")
      .delete()
      .eq("id", id)
      .eq("shop_id", shopId);

    if (deleteItemError) {
      throw new Error(deleteItemError.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to delete item",
      },
      { status: 500 }
    );
  }
}
