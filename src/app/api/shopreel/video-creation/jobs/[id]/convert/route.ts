import { NextResponse } from "next/server";
import { convertMediaJobToStoryGeneration } from "@/features/shopreel/video-creation/lib/convertToStoryGeneration";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const result = await convertMediaJobToStoryGeneration(id);

    return NextResponse.json({
      ok: true,
      generationId: result.generationId,
      alreadyExisted: result.alreadyExisted,
      editorPath: `/shopreel/editor/video/${result.generationId}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to convert media job",
      },
      { status: 500 }
    );
  }
}
