import { NextResponse } from "next/server";
import { createAllMediaJobsForCampaign } from "@/features/shopreel/campaigns/lib/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const mediaJobIds = await createAllMediaJobsForCampaign(id);

    return NextResponse.json({
      ok: true,
      mediaJobIds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create campaign media jobs",
      },
      { status: 500 }
    );
  }
}
