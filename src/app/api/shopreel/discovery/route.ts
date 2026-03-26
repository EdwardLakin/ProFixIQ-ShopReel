import { NextResponse } from "next/server";
import { discoverStorySources } from "@/features/shopreel/discovery/discoverContent";
import { createOpportunities } from "@/features/shopreel/opportunities/createOpportunities";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { saveStorySource } from "@/features/shopreel/story-sources/server/saveStorySource";

export async function POST() {
  try {
    const shopId = await getCurrentShopId();

    const discovered = await discoverStorySources(shopId);

    const saved = [];
    for (const source of discovered) {
      const result = await saveStorySource(source);
      saved.push(result);
    }

    const opportunities = await createOpportunities();

    return NextResponse.json({
      ok: true,
      discoveredCount: discovered.length,
      savedCount: saved.length,
      dedupedCount: saved.filter((item) => item.deduped).length,
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
