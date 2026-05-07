import { NextResponse } from "next/server";
import { requireGrowthAgentOwnerContext } from "@/features/internal-growth/server/guards";
import { updateFeatureStatus } from "@/features/internal-growth/server/repository";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireGrowthAgentOwnerContext();
    const { id } = await ctx.params;
    return NextResponse.json({ feature: await updateFeatureStatus(userId, id, "ignored") });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to ignore feature");
  }
}
