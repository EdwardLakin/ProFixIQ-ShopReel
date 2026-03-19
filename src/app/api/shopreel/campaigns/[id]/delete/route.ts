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

    const { data: campaign, error: campaignError } = await supabase
      .from("shopreel_campaigns")
      .select("id, shop_id")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(campaignError?.message ?? "Campaign not found");
    }

    const { data: itemIds } = await supabase
      .from("shopreel_campaign_items")
      .select("id")
      .eq("campaign_id", id)
      .eq("shop_id", shopId);

    const ids = (itemIds ?? []).map((row) => row.id);

    if (ids.length > 0) {
      await supabase
        .from("shopreel_campaign_item_scenes")
        .delete()
        .in("campaign_item_id", ids)
        .eq("shop_id", shopId);

      for (const itemId of ids) {
        await supabase
          .from("shopreel_media_generation_jobs")
          .delete()
          .ilike("settings::text", `%${itemId}%`);
      }

      await supabase
        .from("shopreel_campaign_items")
        .delete()
        .in("id", ids)
        .eq("shop_id", shopId);
    }

    const { error: deleteCampaignError } = await supabase
      .from("shopreel_campaigns")
      .delete()
      .eq("id", id)
      .eq("shop_id", shopId);

    if (deleteCampaignError) {
      throw new Error(deleteCampaignError.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to delete campaign",
      },
      { status: 500 }
    );
  }
}
