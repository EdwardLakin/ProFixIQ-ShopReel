import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { discoverStorySources } from "@/features/shopreel/discovery/discoverContent";
import { saveStorySource } from "@/features/shopreel/story-sources/server";

export async function POST() {
  try {
    const shopId = await getCurrentShopId();
    const discovered = await discoverStorySources(shopId);

    let created = 0;

    for (const source of discovered) {
      const result = await saveStorySource(source);
      if (!result.deduped) created++;
    }

    return NextResponse.json({
      ok: true,
      sourcesCreated: created,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Discovery failed";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
