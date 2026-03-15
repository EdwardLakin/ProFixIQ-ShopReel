import { NextResponse } from "next/server";
import { runPublishWorker } from "@/features/shopreel/publish/runPublishWorker";

export async function POST() {
  try {
    const result = await runPublishWorker();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "publish worker failed",
      },
      { status: 500 },
    );
  }
}
