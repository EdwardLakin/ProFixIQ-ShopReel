import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { syncAllProcessingVideoJobs } from "@/features/shopreel/video-creation/lib/automation";
import { runCampaignAutomationCycle } from "@/features/shopreel/campaigns/lib/automation";

export async function POST() {
  try {
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();

    const videoSyncResults = await syncAllProcessingVideoJobs();

    const { data: campaigns, error } = await supabase
      .from("shopreel_campaigns")
      .select("id, status")
      .eq("shop_id", shopId)
      .in("status", ["draft", "active", "running"]);

    if (error) {
      throw new Error(error.message);
    }

    const campaignResults = [];
    for (const campaign of campaigns ?? []) {
      const result = await runCampaignAutomationCycle(campaign.id);
      campaignResults.push(result);
    }

    return NextResponse.json({
      ok: true,
      videoSyncResults,
      campaignResults,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run ShopReel automation",
      },
      { status: 500 }
    );
  }
}
