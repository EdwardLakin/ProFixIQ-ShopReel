import { NextResponse } from "next/server";
import { assertInternalGrowthAccess } from "@/features/internal-growth/server/guards";
import { getCampaignPackage } from "@/features/internal-growth/server/repository";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await assertInternalGrowthAccess();
    const { id } = await ctx.params;
    return NextResponse.json(await getCampaignPackage(id));
  } catch (error) { return toEndpointErrorResponse(error, "Failed to load campaign package"); }
}
