import { NextResponse } from "next/server";
import { getExecution } from "@/features/shopreel/agents/execution";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shopId } = await requireUserActionTenantContext();
    const { id } = await params;
    const execution = await getExecution({ shopId, executionId: id });
    if (!execution) return NextResponse.json({ ok: false, error: "Execution not found" }, { status: 404 });
    return NextResponse.json({ ok: true, execution });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to fetch execution");
  }
}
