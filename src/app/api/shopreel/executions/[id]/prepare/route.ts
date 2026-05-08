import { NextResponse } from "next/server";
import { INVALID_EXECUTION_TRANSITION, transitionExecutionState } from "@/features/shopreel/agents/execution-events";
import { validateExecutionReadiness } from "@/features/shopreel/agents/readiness";
import { ShopReelEndpointError, requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { shopId, userId } = await requireUserActionTenantContext();
    const { id } = await ctx.params;
    const readiness = await validateExecutionReadiness({ shopId, executionId: id });
    const execution = await transitionExecutionState({
      shopId, executionId: id, userId,
      nextStatus: readiness.ready ? "prepared" : "blocked",
      metadata: readiness.ready ? {} : { blockingIssues: readiness.blockingIssues, warnings: readiness.warnings },
      message: readiness.ready ? "Execution prepared" : "Execution blocked by readiness validation",
    });
    return NextResponse.json({ ok: true, execution, readiness });
  } catch (error) {
    if (error instanceof Error && error.message === INVALID_EXECUTION_TRANSITION) {
      return toEndpointErrorResponse(new ShopReelEndpointError("Invalid execution transition", 409), "Invalid transition");
    }
    return toEndpointErrorResponse(error, "Failed to prepare execution");
  }
}
