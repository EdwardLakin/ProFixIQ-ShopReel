import { NextResponse } from "next/server";
import { runMediaJobForCampaignItem } from "@/features/shopreel/campaigns/lib/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const mediaJobId = await runMediaJobForCampaignItem(id);

    return NextResponse.json({
      ok: true,
      mediaJobId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run campaign media job",
      },
      { status: 500 }
    );
  }
}
