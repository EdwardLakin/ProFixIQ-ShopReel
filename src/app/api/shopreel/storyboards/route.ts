import { NextResponse } from "next/server";
import { createStoryboard } from "@/features/shopreel/video-creation/lib/storyboards";

type StoryboardSceneInput = {
  title: string;
  prompt: string;
  durationSeconds: number | null;
  sortOrder: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      title?: string;
      prompt?: string;
      concept?: string;
      style?: string | null;
      visualMode?: string | null;
      aspectRatio?: string;
      scenes?: StoryboardSceneInput[];
    };

    const title = body.title?.trim() || "Untitled storyboard";
    const prompt = body.prompt?.trim() || "";
    const concept = body.concept?.trim() || "";
    const style = body.style ?? null;
    const visualMode = body.visualMode ?? null;
    const aspectRatio = body.aspectRatio?.trim() || "9:16";
    const scenes = Array.isArray(body.scenes) ? body.scenes : [];

    const storyboardId = await createStoryboard({
      title,
      prompt,
      style,
      visualMode,
      aspectRatio,
      scenes,
      metadata: concept
        ? {
            concept,
          }
        : {},
    });

    return NextResponse.json({
      ok: true,
      storyboardId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create storyboard",
      },
      { status: 500 }
    );
  }
}
