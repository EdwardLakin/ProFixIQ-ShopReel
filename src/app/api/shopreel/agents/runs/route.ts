import { NextResponse } from "next/server";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";
import { listAgentRuns } from "@/features/shopreel/agents/repository";

export async function GET(req: Request) {
  try {
    const { shopId } = await requireUserActionTenantContext();
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");
    const runs = await listAgentRuns(shopId, campaignId);
    return NextResponse.json({ ok: true, runs });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to list agent runs");
  }
}
