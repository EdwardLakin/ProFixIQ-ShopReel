import { createRenderJob } from "../render/createRenderJob";
import { saveStoryGeneration, saveStorySource } from "../story-sources/server";
import type { StorySource } from "../story-sources";
import { buildStoryDraftFromSource } from "./buildStoryDraftFromSource";
import { createContentPieceFromStoryDraft } from "./createContentPieceFromStoryDraft";

export async function generateStoryPipeline(input: {
  shopId: string;
  source: StorySource;
  templateId?: string | null;
  sourceSystem?: string | null;
  createRenderJobNow?: boolean;
  createdBy?: string | null;
}) {
  const savedSource = await saveStorySource(input.source);

  const draft = buildStoryDraftFromSource(input.source);

  const contentPiece = await createContentPieceFromStoryDraft({
    shopId: input.shopId,
    draft,
    templateId: input.templateId ?? null,
    sourceSystem: input.sourceSystem ?? "shopreel",
  });

  const renderJob = input.createRenderJobNow
    ? await createRenderJob({
        shopId: input.shopId,
        contentPieceId: contentPiece.id,
        sourceType: input.source.kind,
        sourceId: savedSource.id,
        createdBy: input.createdBy ?? null,
        storySource: input.source,
        storyDraft: draft,
        renderPayload: {
          mode: "story_draft",
          title: draft.title,
          hook: draft.hook ?? null,
          caption: draft.caption ?? null,
          cta: draft.cta ?? null,
          scenes: draft.scenes,
        },
      })
    : null;

  const generation = await saveStoryGeneration({
    shopId: input.shopId,
    storySourceId: savedSource.id,
    contentPieceId: contentPiece.id,
    renderJobId: renderJob?.id ?? null,
    draft,
    status: renderJob ? "queued" : "draft",
    createdBy: input.createdBy ?? null,
    metadata: {
      deduped_source: savedSource.deduped,
      source_system: input.sourceSystem ?? "shopreel",
    },
  });

  return {
    savedSource,
    source: input.source,
    draft,
    contentPiece,
    renderJob,
    generation,
  };
}
