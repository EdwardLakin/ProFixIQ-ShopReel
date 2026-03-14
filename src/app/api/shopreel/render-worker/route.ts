import { NextResponse } from "next/server";
import { runRenderWorker } from "@/features/shopreel/render/runRenderWorker";

export async function POST() {
  const result = await runRenderWorker();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
