import { NextRequest, NextResponse } from "next/server";
import { updateLearningSignals } from "@/features/shopreel/learning/updateLearningSignals";

type SignalsBody = {
  shopId?: string;
};

async function safeReadJson(req: NextRequest): Promise<SignalsBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as SignalsBody;
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

  const result = await updateLearningSignals(shopId);

  return NextResponse.json({
    ok: true,
    result,
  });
}
