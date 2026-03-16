import { NextRequest, NextResponse } from "next/server";
import { processRenderJobs } from "@/features/shopreel/worker/processRenderJobs";

type Body = {
  contentPieceId?: string;
};

async function safeReadJson(req: NextRequest): Promise<Body> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as Body;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await safeReadJson(req);

    const result = await processRenderJobs(
      typeof body.contentPieceId === "string" && body.contentPieceId.length > 0
        ? body.contentPieceId
        : null,
    );

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run render worker",
      },
      { status: 500 },
    );
  }
}
