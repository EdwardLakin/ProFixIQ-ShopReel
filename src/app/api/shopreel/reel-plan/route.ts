import { NextRequest, NextResponse } from "next/server";
import { buildAutoEditPlan } from "@/features/shopreel/editing/buildAutoEditPlan";
import { selectMediaForReel } from "@/features/shopreel/media/selectMediaForReel";

type ReelPlanBody = {
  title?: string;
  contentType?: string;
  hook?: string;
  caption?: string;
  cta?: string;
  transcript?: string;
  durationMs?: number;
  visualUrls?: string[];
  workOrderId?: string;
};

async function safeReadJson(req: NextRequest): Promise<ReelPlanBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as ReelPlanBody;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const body = await safeReadJson(req);

  const title =
    typeof body.title === "string" && body.title.length > 0
      ? body.title
      : "Completed repair";

  const contentType =
    typeof body.contentType === "string" && body.contentType.length > 0
      ? body.contentType
      : "repair_story";

  const hook =
    typeof body.hook === "string" && body.hook.length > 0
      ? body.hook
      : "Customer came in with this issue — here’s what we found.";

  const caption =
    typeof body.caption === "string" && body.caption.length > 0
      ? body.caption
      : "Real repair. Real findings. Real fix.";

  const cta =
    typeof body.cta === "string" && body.cta.length > 0
      ? body.cta
      : "Follow for more real repair stories.";

  const transcript =
    typeof body.transcript === "string" && body.transcript.length > 0
      ? body.transcript
      : "Customer came in with this issue. We inspected the vehicle, found the problem, fixed it, and got it back on the road.";

  const durationMs =
    typeof body.durationMs === "number" && body.durationMs > 0
      ? body.durationMs
      : 12000;

  let visualUrls = Array.isArray(body.visualUrls)
    ? body.visualUrls.filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      )
    : [];

  if (visualUrls.length === 0 && typeof body.workOrderId === "string" && body.workOrderId.length > 0) {
    const media = await selectMediaForReel(body.workOrderId);
    visualUrls = media.selectedUrls;
  }

  const plan = buildAutoEditPlan({
    title,
    contentType,
    hook,
    caption,
    cta,
    transcript,
    durationMs,
    visualUrls,
  });

  return NextResponse.json({
    ok: true,
    plan,
    mediaCount: visualUrls.length,
  });
}
