import { NextResponse } from "next/server";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";
import { createPlanningDraft } from "@/features/shopreel/agents/planner";
import type { ShopReelAgentType } from "@/features/shopreel/agents/types";

export async function POST(req: Request) {
  try {
    const { shopId, userId } = await requireUserActionTenantContext();
    const body = (await req.json().catch(() => ({}))) as { campaignId?: string; agentType?: ShopReelAgentType };
    if (!body.campaignId) return NextResponse.json({ ok: false, error: "campaignId is required" }, { status: 400 });
    const plan = await createPlanningDraft({ shopId, campaignId: body.campaignId, userId, agentType: body.agentType ?? "content_strategist" });
    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to create planning draft");
  }
}
