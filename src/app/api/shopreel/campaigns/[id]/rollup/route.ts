import { NextResponse } from "next/server";
import { rollupCampaignAnalytics } from "@/features/shopreel/campaigns/lib/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const analytics = await rollupCampaignAnalytics(id);

    return NextResponse.json({
      ok: true,
      analytics,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to roll up analytics",
      },
      { status: 500 }
    );
  }
}
