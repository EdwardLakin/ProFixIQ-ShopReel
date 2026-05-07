import { NextResponse } from "next/server";
import { approveAgentTask } from "@/features/shopreel/agents/approval";
import { ShopReelEndpointError, requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";
import type { Json } from "@/types/supabase";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shopId, userId } = await requireUserActionTenantContext();
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { reason?: string; metadata?: Json };
    const result = await approveAgentTask({ shopId, taskId: id, userId, reason: body.reason ?? null, metadata: body.metadata ?? {} });
    return NextResponse.json({ ok: true, task: result.task, event: result.event });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_TASK_STATE") {
      return toEndpointErrorResponse(new ShopReelEndpointError("Task is not in proposed state or not found", 409), "Invalid transition");
    }
    return toEndpointErrorResponse(error, "Failed to approve agent task");
  }
}
