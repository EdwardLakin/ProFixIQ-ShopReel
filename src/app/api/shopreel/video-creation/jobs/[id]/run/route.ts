import { NextResponse } from "next/server";
import { processMediaGenerationJob } from "@/features/shopreel/video-creation/lib/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const job = await processMediaGenerationJob(id);

    return NextResponse.json({
      ok: true,
      job,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run media generation job",
      },
      { status: 500 }
    );
  }
}
