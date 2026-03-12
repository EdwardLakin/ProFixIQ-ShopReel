import { createAdminClient } from "@/lib/supabase/server";
import type { StoryDraft } from "../../story-builder";

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export async function saveStoryGeneration(input: {
  shopId: string;
  storySourceId: string;
  contentPieceId?: string | null;
  reelPlanId?: string | null;
  renderJobId?: string | null;
  draft: StoryDraft;
  status?: string;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("shopreel_story_generations")
    .insert({
      shop_id: input.shopId,
      story_source_id: input.storySourceId,
      content_piece_id: input.contentPieceId ?? null,
      reel_plan_id: input.reelPlanId ?? null,
      render_job_id: input.renderJobId ?? null,
      status: input.status ?? "draft",
      story_draft: toJson(input.draft),
      generation_metadata: toJson(input.metadata ?? {}),
      created_by: input.createdBy ?? null,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save story generation");
  }

  return data;
}
