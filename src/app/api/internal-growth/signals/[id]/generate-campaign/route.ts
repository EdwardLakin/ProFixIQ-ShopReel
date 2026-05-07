import { NextResponse } from "next/server";
import { assertInternalGrowthAccess } from "@/features/internal-growth/server/guards";
import { generateCampaignFromSignal } from "@/features/internal-growth/server/repository";
import type { GrowthCampaignType, GrowthPlatform } from "@/features/internal-growth/server/types";
import { ShopReelEndpointError, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await assertInternalGrowthAccess();
    const { id } = await ctx.params;
    const body = (await req.json()) as { campaignType?: GrowthCampaignType; targetPlatforms?: GrowthPlatform[] };
    if (!body.campaignType) throw new ShopReelEndpointError("campaignType is required", 400);
    return NextResponse.json(await generateCampaignFromSignal(userId, id, body.campaignType, body.targetPlatforms ?? []));
  } catch (error) { return toEndpointErrorResponse(error, "Failed to generate campaign from signal"); }
}
