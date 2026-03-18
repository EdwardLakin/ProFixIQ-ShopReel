import { NextResponse } from "next/server";
import { syncProcessingMediaJobsForCampaign } from "@/features/shopreel/campaigns/lib/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const syncedJobIds = await syncProcessingMediaJobsForCampaign(id);

    return NextResponse.json({
      ok: true,
      syncedJobIds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to sync processing jobs",
      },
      { status: 500 }
    );
  }
}
