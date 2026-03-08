import { NextRequest, NextResponse } from "next/server"
import { detectViralMoments } from "@/features/shopreel/moments/detectViralMoments"

export async function POST(req: NextRequest) {

  const body = await req.json().catch(() => ({}))

  const shopId = body.shopId ?? "e4d23a6d-9418-49a5-8a1b-6a2640615b5b"

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

}
