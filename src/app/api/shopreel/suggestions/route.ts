import { NextRequest, NextResponse } from "next/server"
import { detectViralMoments } from "@/features/shopreel/moments/detectViralMoments"
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const shopId = typeof body.shopId === "string" && body.shopId.length > 0 ? body.shopId : await getCurrentShopId()
    const moments = await detectViralMoments(shopId)
    const suggestions = moments
      .filter(m => m.viralScore >= 85)
      .map(m => ({
        ...m,
        prompt: "This repair could make a great video. Record a quick explanation?"
      }))

    return NextResponse.json({
      ok: true,
      suggestions
    })
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to load suggestions");
  }
}
