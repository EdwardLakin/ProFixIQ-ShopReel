import { createAdminClient } from "@/lib/supabase/server";
import type { StoryDraft } from "../story-builder";
import type { StorySource } from "../story-sources";

export type CreateRenderJobInput = {
  shopId: string;
  contentPieceId?: string | null;
  publicationId?: string | null;
  workOrderId?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  createdBy?: string | null;
  renderPayload: unknown;
  storySource?: StorySource | null;
  storyDraft?: StoryDraft | null;
};

export async function createRenderJob(input: CreateRenderJobInput) {
  const supabase = createAdminClient();

  const basePayload =
    input.renderPayload && typeof input.renderPayload === "object" && !Array.isArray(input.renderPayload)
      ? (input.renderPayload as Record<string, unknown>)
      : { value: input.renderPayload };

  const payload = {
    shop_id: input.shopId,
    content_piece_id: input.contentPieceId ?? null,
    publication_id: input.publicationId ?? null,
    status: "queued",
    render_payload: {
      ...basePayload,
      story_source: input.storySource ?? null,
      story_draft: input.storyDraft ?? null,
      source_type: input.sourceType ?? null,
      source_id: input.sourceId ?? null,
      created_by: input.createdBy ?? null,
      work_order_id: input.workOrderId ?? null,
      content_piece_id: input.contentPieceId ?? null,
      publication_id: input.publicationId ?? null,
    },
  };

  const { data, error } = await supabase
    .from("reel_render_jobs")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
