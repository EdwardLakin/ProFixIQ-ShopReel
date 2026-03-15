import { NextResponse } from "next/server";
import { runScheduledPublishWorker } from "@/features/shopreel/scheduler/runScheduledPublishWorker";

export async function POST() {
  try {
    const result = await runScheduledPublishWorker();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "scheduler failed",
      },
      { status: 500 },
    );
  }
}
