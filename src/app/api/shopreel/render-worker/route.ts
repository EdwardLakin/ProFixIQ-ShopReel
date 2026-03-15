import { NextRequest, NextResponse } from "next/server";
import { runRenderWorker } from "@/features/shopreel/render/runRenderWorker";

type RenderBody = {
  contentPieceId?: string;
};

async function safeReadJson(req: NextRequest): Promise<RenderBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as RenderBody;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await safeReadJson(req);
    const result = await runRenderWorker(body.contentPieceId ?? null);

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
