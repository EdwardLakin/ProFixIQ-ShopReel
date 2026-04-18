import { NextResponse } from "next/server";
import {
  REVIEW_APPROVAL_APPROVED_STATE,
  REVIEW_APPROVAL_NEEDS_CHANGES_STATE,
} from "@/features/shopreel/lib/contracts/lifecycle";
import { createAdminClient } from "@/lib/supabase/server";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

type ReviewAction = "approve" | "needs_changes";

type Body = {
  action?: ReviewAction;
  note?: string | null;
};

function isReviewAction(value: unknown): value is ReviewAction {
  return value === "approve" || value === "needs_changes";
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Body;

    if (!isReviewAction(body.action)) {
      return NextResponse.json({ ok: false, error: "Invalid review action" }, { status: 400 });
    }

    const note = typeof body.note === "string" ? body.note.trim() : "";
    const { shopId, userId } = await requireUserActionTenantContext();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { data: generation, error: generationError } = await legacy
      .from("shopreel_story_generations")
      .select("id")
      .eq("id", id)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (generationError) {
      throw new Error(generationError.message);
    }

    if (!generation) {
      return NextResponse.json({ ok: false, error: "Generation not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const nextState = body.action === "approve" ? REVIEW_APPROVAL_APPROVED_STATE : REVIEW_APPROVAL_NEEDS_CHANGES_STATE;

    const { error: updateError } = await legacy
      .from("shopreel_story_generations")
      .update({
        review_approval_state: nextState,
        reviewed_by: userId,
        reviewed_at: now,
        review_note: note.length > 0 ? note : null,
        updated_at: now,
      })
      .eq("id", id)
      .eq("shop_id", shopId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      ok: true,
      generationId: id,
      reviewApprovalState: nextState,
      reviewedBy: userId,
      reviewedAt: now,
      reviewNote: note.length > 0 ? note : null,
    });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to update review approval");
  }
}
