import { NextResponse } from "next/server";
import { runRenderWorker } from "@/features/shopreel/render/runRenderWorker";

export async function POST() {
  try {
    const result = await runRenderWorker();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "render worker failed",
      },
      { status: 500 },
    );
  }
}
