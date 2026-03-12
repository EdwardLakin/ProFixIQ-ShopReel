import { buildStoryDraftFromSource, createContentPieceFromStoryDraft } from "../story-builder";
import type { StorySource } from "./types";

export async function generateContentPieceFromSource(input: {
  shopId: string;
  source: StorySource;
  templateId?: string | null;
  sourceSystem?: string | null;
}) {
  const draft = buildStoryDraftFromSource(input.source);

  const contentPiece = await createContentPieceFromStoryDraft({
    shopId: input.shopId,
    draft,
    templateId: input.templateId ?? null,
    sourceSystem: input.sourceSystem ?? "shopreel",
  });

  return {
    source: input.source,
    draft,
    contentPiece,
  };
}
