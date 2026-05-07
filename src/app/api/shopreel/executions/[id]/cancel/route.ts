import { NextResponse } from "next/server";
import { cancelExecution } from "@/features/shopreel/agents/execution";
import { ShopReelEndpointError, requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shopId, userId } = await requireUserActionTenantContext();
    const { id } = await params;
    const execution = await cancelExecution({ shopId, executionId: id, userId });
    return NextResponse.json({ ok: true, execution });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EXECUTION_STATE") {
      return toEndpointErrorResponse(new ShopReelEndpointError("Execution is not cancelable in current state", 409), "Invalid execution state");
    }
    return toEndpointErrorResponse(error, "Failed to cancel execution");
  }
}
