import { NextRequest, NextResponse } from "next/server";
import { runShopReelAutopilot } from "@/features/shopreel/server/scheduler";

type AutopilotRequestBody = {
  shopId?: string;
};

async function safeReadJson(req: NextRequest): Promise<AutopilotRequestBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as AutopilotRequestBody;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const body = await safeReadJson(req);

  const shopId =
    typeof body.shopId === "string" && body.shopId.length > 0
      ? body.shopId
      : "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

  const result = await runShopReelAutopilot(shopId);

  return NextResponse.json(result);
}