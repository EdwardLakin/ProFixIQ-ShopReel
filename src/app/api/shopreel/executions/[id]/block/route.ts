import { NextResponse } from "next/server";
import { INVALID_EXECUTION_TRANSITION, transitionExecutionState } from "@/features/shopreel/agents/execution-events";
import { ShopReelEndpointError, requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { shopId, userId } = await requireUserActionTenantContext();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { message?: string };
    const execution = await transitionExecutionState({ shopId, executionId: id, userId, nextStatus: "blocked", message: body.message ?? null });
    return NextResponse.json({ ok: true, execution });
  } catch (error) {
    if (error instanceof Error && error.message === INVALID_EXECUTION_TRANSITION) return toEndpointErrorResponse(new ShopReelEndpointError("Invalid execution transition", 409), "Invalid transition");
    return toEndpointErrorResponse(error, "Failed to block execution");
  }
}
