import { NextResponse } from "next/server";
import { requireGrowthAgentOwnerContext } from "@/features/internal-growth/server/guards";
import { completeRun, createRun, upsertFeatures } from "@/features/internal-growth/server/repository";
import { scanShopReelRoutes } from "@/features/internal-growth/server/featureScanner";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST() {
  try {
    const { userId } = await requireGrowthAgentOwnerContext();
    const run = await createRun(userId, "running");
    const features = await scanShopReelRoutes();
    const saved = await upsertFeatures(features, run.id);
    await completeRun(run.id, "completed", `Discovered ${saved.length} features.`);
    return NextResponse.json({ run, features: saved });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to run growth scan");
  }
}
