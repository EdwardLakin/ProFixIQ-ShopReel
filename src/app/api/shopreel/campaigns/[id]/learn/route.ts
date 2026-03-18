import { NextResponse } from "next/server";
import { extractCampaignLearnings } from "@/features/shopreel/campaigns/lib/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const result = await extractCampaignLearnings(id);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to extract campaign learnings",
      },
      { status: 500 }
    );
  }
}
