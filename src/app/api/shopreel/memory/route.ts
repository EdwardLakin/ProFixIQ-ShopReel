import { NextRequest, NextResponse } from "next/server";
import { updateMarketingMemory } from "@/features/shopreel/memory/updateMarketingMemory";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { shopId?: string };
    const shopId = typeof body.shopId === "string" && body.shopId.length > 0 ? body.shopId : await getCurrentShopId();
    const result = await updateMarketingMemory(shopId);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to update memory");
  }
}
