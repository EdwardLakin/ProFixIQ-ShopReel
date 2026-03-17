import { NextResponse } from "next/server";
import { createMediaGenerationJob } from "@/features/shopreel/video-creation/lib/server";
import type { VideoCreationFormInput } from "@/features/shopreel/video-creation/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VideoCreationFormInput;

    const job = await createMediaGenerationJob(body);

    return NextResponse.json({
      ok: true,
      job,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create media generation job",
      },
      { status: 500 }
    );
  }
}
