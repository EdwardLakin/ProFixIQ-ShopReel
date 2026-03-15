import { NextRequest, NextResponse } from "next/server";
import { runPublishWorker } from "@/features/shopreel/publish/runPublishWorker";

type PublishBody = {
  contentPieceId?: string;
};

async function safeReadJson(req: NextRequest): Promise<PublishBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as PublishBody;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await safeReadJson(req);
    const result = await runPublishWorker(body.contentPieceId ?? null);

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
