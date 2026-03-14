import { NextResponse } from "next/server";
import { runScheduledPublishWorker } from "@/features/shopreel/scheduler/runScheduledPublishWorker";

export async function POST() {
  const result = await runScheduledPublishWorker();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
