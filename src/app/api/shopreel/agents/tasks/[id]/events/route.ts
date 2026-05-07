import { NextResponse } from "next/server";
import { listApprovalEvents } from "@/features/shopreel/agents/approval";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shopId } = await requireUserActionTenantContext();
    const { id } = await params;
    const events = await listApprovalEvents({ shopId, taskId: id });
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to list approval events");
  }
}
