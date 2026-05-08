import { NextResponse } from "next/server";
import { validateExecutionReadiness } from "@/features/shopreel/agents/readiness";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { shopId } = await requireUserActionTenantContext();
    const { id } = await ctx.params;
    const readiness = await validateExecutionReadiness({ shopId, executionId: id });
    return NextResponse.json({ ok: true, executionId: id, readiness });
  } catch (error) { return toEndpointErrorResponse(error, "Failed to validate readiness"); }
}
