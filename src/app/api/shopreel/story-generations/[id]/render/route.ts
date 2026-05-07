import { NextResponse } from "next/server";
import { requireUserActionTenantContext } from "@/features/shopreel/server/endpointPolicy";
import { startRenderForGeneration } from "@/features/shopreel/render/startRenderForGeneration";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const req = _req;
    const body = (await req.json().catch(() => ({}))) as { preflight?: { status?: string; blockers?: Array<{ message: string }> } };
    const { id } = await ctx.params;
    if (body.preflight?.status === "blocked") {
      return NextResponse.json({ ok: false, error: `Preflight blocked: ${(body.preflight.blockers ?? []).map((b) => b.message).join("; ")}` }, { status: 400 });
    }
    const { shopId } = await requireUserActionTenantContext();
    const result = await startRenderForGeneration({ generationId: id, shopId });
    return NextResponse.json({ ok: true, renderJobId: result.renderJobId, created: result.created, renderJobsUrl: "/shopreel/render-jobs" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to queue render";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
