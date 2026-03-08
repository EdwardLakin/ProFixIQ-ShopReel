import { NextRequest, NextResponse } from "next/server";
import { discoverContent } from "@/features/shopreel/discovery/discoverContent";

type DiscoverRequestBody = {
  shopId?: string;
};

async function safeReadJson(req: NextRequest): Promise<DiscoverRequestBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as DiscoverRequestBody;
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

  const result = await discoverContent(shopId);

  return NextResponse.json({
    ok: true,
    result,
  });
}
