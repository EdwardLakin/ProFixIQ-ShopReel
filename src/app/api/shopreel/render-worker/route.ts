import { NextResponse } from "next/server";
import { processRenderJobs } from "@/features/shopreel/worker/processRenderJobs";

export async function POST() {
  try {
    const result = await processRenderJobs();

    return NextResponse.json({
      ok: true,
      processed: result.processed,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process render jobs";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
