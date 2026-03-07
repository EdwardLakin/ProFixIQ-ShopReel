import { NextResponse } from "next/server";
import { discoverContent } from "@/features/shopreel/discovery/discoverContent";

export async function GET() {
  const shopId = "dev";

  const results = await discoverContent(shopId);

  return NextResponse.json({
    ok: true,
    results
  });
}