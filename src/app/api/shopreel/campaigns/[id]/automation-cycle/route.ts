import { NextResponse } from "next/server";
import {
  syncProcessingMediaJobsForCampaign,
  rollupCampaignAnalytics,
  extractCampaignLearnings,
} from "@/features/shopreel/campaigns/lib/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const syncedJobIds = await syncProcessingMediaJobsForCampaign(id);
    const analytics = await rollupCampaignAnalytics(id);
    const learnings = await extractCampaignLearnings(id);

    return NextResponse.json({
      ok: true,
      syncedJobIds,
      analytics,
      learnings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run automation cycle",
      },
      { status: 500 }
    );
  }
}
