import { NextRequest, NextResponse } from "next/server";
import { selectMediaForReel } from "@/features/shopreel/media/selectMediaForReel";

type MediaBody = {
  workOrderId?: string;
};

async function safeReadJson(req: NextRequest): Promise<MediaBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as MediaBody;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const body = await safeReadJson(req);

  if (typeof body.workOrderId !== "string" || body.workOrderId.length === 0) {
    return NextResponse.json(
      { error: "workOrderId is required" },
      { status: 400 },
    );
  }

  const result = await selectMediaForReel(body.workOrderId);

  return NextResponse.json({
    ok: true,
    result,
  });
}
