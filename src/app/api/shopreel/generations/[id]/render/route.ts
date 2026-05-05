import { NextResponse } from "next/server";
import { requireUserActionTenantContext } from "@/features/shopreel/server/endpointPolicy";
import { startRenderForGeneration } from "@/features/shopreel/render/startRenderForGeneration";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { shopId } = await requireUserActionTenantContext();
    const result = await startRenderForGeneration({ generationId: id, shopId });

    return NextResponse.json({ ok: true, renderJobId: result.renderJobId, created: result.created, renderJobsUrl: "/shopreel/render-jobs" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to queue render";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
