import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { ensureScenesForCampaignItem, createMediaJobsForCampaignItemScenes } from "@/features/shopreel/campaigns/lib/multiscene";
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

    const scenes = await ensureScenesForCampaignItem(id);
    const createdJobIds = await createMediaJobsForCampaignItemScenes(id);

    revalidatePath(`/shopreel/campaigns/${item.campaign_id}`);
    revalidatePath(`/shopreel/campaigns/items/${item.id}`);

    return NextResponse.json({
      ok: true,
      scenesCreated: scenes.length,
      createdJobIds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create scene jobs",
      },
      { status: 500 }
    );
  }
}
