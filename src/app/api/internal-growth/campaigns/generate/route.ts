import { NextResponse } from "next/server";
import { requireGrowthAgentOwnerContext } from "@/features/internal-growth/server/guards";
import { generateCampaign } from "@/features/internal-growth/server/repository";
import { toEndpointErrorResponse, ShopReelEndpointError } from "@/features/shopreel/server/endpointPolicy";
import type { GrowthCampaignType, GrowthPlatform } from "@/features/internal-growth/server/types";

export async function POST(req: Request) {
  try {
    const { userId } = await requireGrowthAgentOwnerContext();
    const body = (await req.json()) as { featureId?: string; campaignType?: GrowthCampaignType; targetPlatforms?: GrowthPlatform[]; forceRegenerate?: boolean };
    if (!body.featureId || !body.campaignType) throw new ShopReelEndpointError("featureId and campaignType are required", 400);
    const out = await generateCampaign(userId, body.featureId, body.campaignType, body.targetPlatforms ?? [], body.forceRegenerate === true);
    return NextResponse.json(out);
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to generate campaign drafts");
  }
}
