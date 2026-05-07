import { NextResponse } from "next/server";
import { createExecutionFromApprovedTask } from "@/features/shopreel/agents/execution";
import { ShopReelEndpointError, requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shopId, userId } = await requireUserActionTenantContext();
    const { id } = await params;
    const execution = await createExecutionFromApprovedTask({ shopId, taskId: id, userId });
    return NextResponse.json({ ok: true, execution });
  } catch (error) {
    if (error instanceof Error && ["TASK_NOT_APPROVED", "ACTIVE_EXECUTION_EXISTS"].includes(error.message)) {
      return toEndpointErrorResponse(new ShopReelEndpointError("Execution cannot be created for this task state", 409), "Invalid execution state");
    }
    return toEndpointErrorResponse(error, "Failed to prepare execution");
  }
}
