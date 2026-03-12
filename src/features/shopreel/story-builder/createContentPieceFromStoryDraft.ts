import { createAdminClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";
import type { StoryDraft } from "./types";
import { buildContentPieceInsertFromDraft } from "./buildContentPieceInsertFromDraft";

type ContentPieceRow = Tables<"content_pieces">;

export async function createContentPieceFromStoryDraft(input: {
  shopId: string;
  draft: StoryDraft;
  templateId?: string | null;
  sourceSystem?: string | null;
}): Promise<ContentPieceRow> {
  const supabase = createAdminClient();

  const insertPayload = buildContentPieceInsertFromDraft({
    shopId: input.shopId,
    draft: input.draft,
    templateId: input.templateId ?? null,
    sourceSystem: input.sourceSystem ?? "shopreel",
  });

  const { data, error } = await supabase
    .from("content_pieces")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create content piece from story draft");
  }

  return data;
}
