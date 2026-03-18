import { NextResponse } from "next/server";
import { assembleCampaignItemVideo } from "@/features/shopreel/video-creation/lib/assembly";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const asset = await assembleCampaignItemVideo(id);

    return NextResponse.json({
      ok: true,
      asset,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to assemble campaign item video",
      },
      { status: 500 }
    );
  }
}
