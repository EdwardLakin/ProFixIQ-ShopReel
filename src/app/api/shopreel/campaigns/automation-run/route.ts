import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import {
  syncProcessingMediaJobsForCampaign,
  rollupCampaignAnalytics,
  extractCampaignLearnings,
} from "@/features/shopreel/campaigns/lib/server";

export async function POST() {
  try {
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();

    const { data: campaigns, error } = await supabase
      .from("shopreel_campaigns")
      .select("id")
      .eq("shop_id", shopId)
      .in("status", ["draft", "active", "running"]);

    if (error) {
      throw new Error(error.message);
    }

    const results = [];

    for (const campaign of campaigns ?? []) {
      const syncedJobIds = await syncProcessingMediaJobsForCampaign(campaign.id);
      const analytics = await rollupCampaignAnalytics(campaign.id);
      const learnings = await extractCampaignLearnings(campaign.id);

      results.push({
        campaignId: campaign.id,
        syncedJobIds,
        winningAngle: analytics.winning_angle,
        learningsInserted: learnings.inserted,
      });
    }

    return NextResponse.json({
      ok: true,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run campaign automation",
      },
      { status: 500 }
    );
  }
}
