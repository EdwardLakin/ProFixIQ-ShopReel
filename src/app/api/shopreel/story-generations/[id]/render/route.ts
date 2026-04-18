import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createRenderJob } from "@/features/shopreel/render/createRenderJob";
import type { StoryDraft } from "@/features/shopreel/story-builder/types";
import { requireUserActionTenantContext } from "@/features/shopreel/server/endpointPolicy";
import { STORY_GENERATION_QUEUED_STATUS } from "@/features/shopreel/lib/contracts/lifecycle";

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { shopId } = await requireUserActionTenantContext();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { data: generation, error } = await legacy
      .from("shopreel_story_generations")
      .select("*")
      .eq("id", id)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!generation) {
      return NextResponse.json(
        { ok: false, error: "Story generation not found" },
        { status: 404 },
      );
    }

    const draft = generation.story_draft as StoryDraft | null;
    if (!draft) {
      return NextResponse.json(
        { ok: false, error: "Story draft missing" },
        { status: 400 },
      );
    }

    const renderJob = await createRenderJob({
      shopId,
      contentPieceId: generation.content_piece_id ?? null,
      sourceType: draft.sourceKind,
      sourceId: generation.story_source_id,
      storyDraft: draft,
      renderPayload: {
        mode: "story_draft",
        title: draft.title,
        hook: draft.hook ?? null,
        caption: draft.caption ?? null,
        cta: draft.cta ?? null,
        scenes: draft.scenes,
      },
    });

    await legacy
      .from("shopreel_story_generations")
      .update({
        render_job_id: renderJob.id,
        status: STORY_GENERATION_QUEUED_STATUS,
        generation_metadata: {
          ...objectRecord(generation.generation_metadata ?? {}),
          rerender_requested_at: new Date().toISOString(),
          rerender_job_id: renderJob.id,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", generation.id);

    return NextResponse.json({
      ok: true,
      renderJobId: renderJob.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to queue render";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
