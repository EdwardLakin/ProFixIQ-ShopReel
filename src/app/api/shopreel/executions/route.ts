import { NextResponse } from "next/server";
import { listExecutionsForCampaign } from "@/features/shopreel/agents/execution";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function GET(req: Request) {
  try {
    const { shopId } = await requireUserActionTenantContext();
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");
    const executions = await listExecutionsForCampaign({ shopId, campaignId });
    return NextResponse.json({ ok: true, executions });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to list executions");
  }
}
