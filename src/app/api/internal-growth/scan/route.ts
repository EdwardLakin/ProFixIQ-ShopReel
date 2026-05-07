import { NextResponse } from "next/server";
import { requireGrowthAgentOwnerContext } from "@/features/internal-growth/server/guards";
import { completeRun, createRun, upsertFeatures } from "@/features/internal-growth/server/repository";
import { scanShopReelRoutes } from "@/features/internal-growth/server/featureScanner";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST() {
  const { userId } = await requireGrowthAgentOwnerContext();
  const run = await createRun(userId, "running");
  try {
    const features = await scanShopReelRoutes();
    const saved = await upsertFeatures(features, run.id, userId);
    await completeRun(run.id, "completed", `Discovered ${saved.length} features.`);
    return NextResponse.json({ run, features: saved, phase: "draft_only" });
  } catch (error) {
    await completeRun(run.id, "failed", "Growth scan failed", error instanceof Error ? error.message : "Unknown failure");
    return toEndpointErrorResponse(error, "Failed to run growth scan");
  }
}
