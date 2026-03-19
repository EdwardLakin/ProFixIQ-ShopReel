import { NextResponse } from "next/server";
import { ensureScenesForCampaignItem, createMediaJobsForCampaignItemScenes } from "@/features/shopreel/campaigns/lib/multiscene";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const scenes = await ensureScenesForCampaignItem(id);
    const createdJobIds = await createMediaJobsForCampaignItemScenes(id);

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
