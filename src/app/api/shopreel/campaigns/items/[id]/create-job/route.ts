import { NextResponse } from "next/server";
import { createMediaJobForCampaignItem } from "@/features/shopreel/campaigns/lib/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const mediaJobId = await createMediaJobForCampaignItem(id);

    return NextResponse.json({
      ok: true,
      mediaJobId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create media job",
      },
      { status: 500 }
    );
  }
}
