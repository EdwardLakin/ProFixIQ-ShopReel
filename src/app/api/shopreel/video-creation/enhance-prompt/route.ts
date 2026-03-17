import { NextResponse } from "next/server";
import { enhancePromptWithBrandVoice } from "@/features/shopreel/video-creation/lib/enhancement";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      prompt?: string | null;
      style?: string | null;
      visualMode?: string | null;
      aspectRatio?: string;
      durationSeconds?: number | null;
    };

    const enhancedPrompt = await enhancePromptWithBrandVoice({
      prompt: body.prompt ?? null,
      style: body.style ?? null,
      visualMode: body.visualMode ?? null,
      aspectRatio: body.aspectRatio ?? "9:16",
      durationSeconds: body.durationSeconds ?? null,
    });

    return NextResponse.json({
      ok: true,
      enhancedPrompt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to enhance prompt",
      },
      { status: 500 }
    );
  }
}
