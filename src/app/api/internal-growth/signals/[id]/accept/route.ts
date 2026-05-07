import { NextResponse } from "next/server";
import { assertInternalGrowthAccess } from "@/features/internal-growth/server/guards";
import { updateSignalStatus } from "@/features/internal-growth/server/repository";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await assertInternalGrowthAccess();
    const { id } = await ctx.params;
    return NextResponse.json(await updateSignalStatus(userId, id, "accepted"));
  } catch (error) { return toEndpointErrorResponse(error, "Failed to accept signal"); }
}
