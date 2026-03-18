import { NextResponse } from "next/server";
import { discoverStorySources } from "@/features/shopreel/discovery/discoverContent";
import { createOpportunities } from "@/features/shopreel/opportunities/createOpportunities";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function POST() {
  try {
    const shopId = await getCurrentShopId();

    const discovered = await discoverStorySources(shopId);
    const opportunities = await createOpportunities();

    return NextResponse.json({
      ok: true,
      discoveredCount: Array.isArray(discovered) ? discovered.length : 0,
      opportunityCount: Array.isArray(opportunities) ? opportunities.length : 0,
      opportunities,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Discovery failed",
      },
      { status: 500 }
    );
  }
}
