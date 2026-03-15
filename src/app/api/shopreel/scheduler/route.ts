import { NextRequest, NextResponse } from "next/server";
import { runScheduledPublishWorker } from "@/features/shopreel/scheduler/runScheduledPublishWorker";

type SchedulerBody = {
  contentPieceId?: string;
};

async function safeReadJson(req: NextRequest): Promise<SchedulerBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as SchedulerBody;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await safeReadJson(req);
    const result = await runScheduledPublishWorker(body.contentPieceId ?? null);

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
