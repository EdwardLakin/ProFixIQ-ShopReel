import { NextResponse } from "next/server";
import { requireGrowthAgentOwnerContext } from "@/features/internal-growth/server/guards";
import { updateDraft } from "@/features/internal-growth/server/repository";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireGrowthAgentOwnerContext();
    const { id } = await ctx.params;
    return NextResponse.json({ draft: await updateDraft(userId, id, { status: "rejected" }) });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to reject draft");
  }
}
