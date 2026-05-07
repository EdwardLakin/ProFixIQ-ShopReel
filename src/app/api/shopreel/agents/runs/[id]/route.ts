import { NextResponse } from "next/server";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";
import { getAgentRunWithTasks } from "@/features/shopreel/agents/repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { shopId } = await requireUserActionTenantContext();
    const result = await getAgentRunWithTasks(shopId, id);
    if (!result.run) return NextResponse.json({ ok: false, error: "Run not found" }, { status: 404 });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to fetch agent run");
  }
}
