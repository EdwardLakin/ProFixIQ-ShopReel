import { NextResponse } from "next/server";
import { processRenderJobs } from "@/features/shopreel/worker/processRenderJobs";

export async function POST() {
  const result = await processRenderJobs();

  return NextResponse.json({
    ok: true,
    result,
  });
}
