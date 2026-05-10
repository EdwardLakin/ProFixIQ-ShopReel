import { createAdminClient } from "@/lib/supabase/server";
import { createRenderJob } from "@/features/shopreel/render/createRenderJob";
import type { StoryDraft } from "@/features/shopreel/story-builder/types";
import { STORY_GENERATION_QUEUED_STATUS } from "@/features/shopreel/lib/contracts/lifecycle";
import type { Json, TablesUpdate } from "@/types/supabase";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as UnknownRecord;
}

function toJson(value: unknown): Json {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value.map((entry) => toJson(entry));
  if (typeof value === "object") {
    const out: Record<string, Json | undefined> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = toJson(v);
    }
    return out;
  }
  return String(value);
}

export async function startRenderForGeneration(input: { shopId: string; generationId: string; handoff?: { preflight?: { status?: string; score?: number; blockers?: Array<{ message: string }>; warnings?: Array<{ message: string }> }; publishIntent?: { targetPlatforms?: string[]; title?: string; caption?: string; cta?: string; variantId?: string; variantName?: string; sceneCount?: number; durationSeconds?: number; editorSessionId?: string } } }) {
  const supabase = createAdminClient();

  const { data: generation, error } = await supabase
    .from("shopreel_story_generations")
    .select("*")
    .eq("id", input.generationId)
    .eq("shop_id", input.shopId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!generation) throw new Error("Story generation not found");

  const draft = generation.story_draft as StoryDraft | null;
  if (!draft) throw new Error("Story draft missing");

  if (generation.render_job_id) {
    const { data: existing } = await supabase
      .from("reel_render_jobs")
      .select("id, status")
      .eq("id", generation.render_job_id)
      .eq("shop_id", input.shopId)
      .maybeSingle();

    if (existing && ["queued", "rendering", "ready"].includes(existing.status)) {
      return { renderJobId: existing.id, created: false };
    }
  }

  const metadata = asRecord(generation.generation_metadata);

  const renderJob = await createRenderJob({
    shopId: input.shopId,
    contentPieceId: generation.content_piece_id ?? null,
    sourceType: draft.sourceKind,
    sourceId: generation.story_source_id,
    storyDraft: draft,
    renderPayload: {
      mode: "story_draft",
      title: draft.title,
      prompt: typeof metadata.prompt === "string" ? metadata.prompt : null,
      platform_ids: Array.isArray(metadata.platformIds) ? metadata.platformIds : [],
      hook: draft.hook ?? null,
      caption: draft.caption ?? null,
      cta: draft.cta ?? null,
      scenes: draft.scenes,
      handoff: input.handoff ?? null,
    },
  });

  const nextMetadata = {
        ...metadata,
        rerender_requested_at: new Date().toISOString(),
        rerender_job_id: renderJob.id,
        preflight: input.handoff?.preflight ?? metadata.preflight ?? null,
        publishIntent: input.handoff?.publishIntent ?? metadata.publishIntent ?? null,
        activeVariantName: input.handoff?.publishIntent?.variantName ?? metadata.activeVariantName ?? null,
        sceneCount: input.handoff?.publishIntent?.sceneCount ?? draft.scenes.length,
        duration_seconds: input.handoff?.publishIntent?.durationSeconds ?? metadata.duration_seconds ?? null,
        editorSessionId: input.handoff?.publishIntent?.editorSessionId ?? metadata.editorSessionId ?? null,
        publishSource: "render",
      };

  const generationUpdate: TablesUpdate<"shopreel_story_generations"> = {
    render_job_id: renderJob.id,
    status: STORY_GENERATION_QUEUED_STATUS,
    generation_metadata: toJson(nextMetadata),
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from("shopreel_story_generations")
    .update(generationUpdate)
    .eq("id", generation.id)
    .eq("shop_id", input.shopId);

  return { renderJobId: renderJob.id, created: true };
}
