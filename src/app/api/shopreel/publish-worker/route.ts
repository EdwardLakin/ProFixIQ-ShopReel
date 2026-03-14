import { NextResponse } from "next/server";
import { runPublishWorker } from "@/features/shopreel/publish/runPublishWorker";

export async function POST() {
  const result = await runPublishWorker();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
