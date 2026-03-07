import { NextRequest, NextResponse } from "next/server";
import { updateMarketingMemory } from "@/features/shopreel/memory/updateMarketingMemory";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const shopId =
    typeof body.shopId === "string" && body.shopId.length > 0
      ? body.shopId
      : "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

  const result = await updateMarketingMemory(shopId);

  return NextResponse.json({ ok: true, result });
}
