import type { ShopReelPlatformId } from "@/features/shopreel/platforms/presets";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as UnknownRecord;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function platformIdsFrom(value: unknown): ShopReelPlatformId[] {
  const raw = asStringArray(value);
  return raw.filter((id): id is ShopReelPlatformId =>
    id === "instagram_reels" ||
    id === "facebook_reels" ||
    id === "tiktok" ||
    id === "youtube_shorts",
  );
}

export type ShopReelReviewDraft = {
  generationId: string;
  sourceId?: string;
  contentPieceId?: string;
  prompt: string;
  audience?: string;
  platforms: ShopReelPlatformId[];
  status: string;
  conceptTitle?: string;
  hook?: string;
  script?: string;
  voiceover?: string;
  onScreenText?: string[];
  captionText?: string;
  hashtags?: string[];
  thumbnailDirection?: string;
  notes?: string;
  manualAssetId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function mapGenerationToReviewDraft(input: {
  generation: Record<string, unknown>;
  storySource?: Record<string, unknown> | null;
  contentPiece?: Record<string, unknown> | null;
}): ShopReelReviewDraft {
  const generation = asRecord(input.generation);
  const storyDraft = asRecord(generation.story_draft);
  const metadata = asRecord(generation.generation_metadata);
  const sourceMetadata = asRecord(input.storySource?.metadata ?? null);
  const contentPiece = asRecord(input.contentPiece ?? null);

  const prompt =
    (typeof storyDraft.sourceText === "string" && storyDraft.sourceText) ||
    (typeof input.storySource?.description === "string" && input.storySource.description) ||
    (typeof metadata.prompt === "string" && metadata.prompt) ||
    "";

  const platforms = platformIdsFrom(metadata.platformIds ?? sourceMetadata.platformIds);

  return {
    generationId: String(generation.id ?? ""),
    sourceId: typeof generation.story_source_id === "string" ? generation.story_source_id : undefined,
    contentPieceId: typeof generation.content_piece_id === "string" ? generation.content_piece_id : undefined,
    prompt,
    audience:
      (typeof metadata.audience === "string" && metadata.audience) ||
      (typeof sourceMetadata.audience === "string" && sourceMetadata.audience) ||
      undefined,
    platforms,
    status: typeof generation.status === "string" ? generation.status : "draft",
    conceptTitle:
      (typeof storyDraft.title === "string" && storyDraft.title) ||
      (typeof contentPiece.title === "string" && contentPiece.title) ||
      undefined,
    hook:
      (typeof storyDraft.hook === "string" && storyDraft.hook) ||
      (typeof contentPiece.hook === "string" && contentPiece.hook) ||
      undefined,
    script:
      (typeof storyDraft.scriptText === "string" && storyDraft.scriptText) ||
      (typeof contentPiece.script_text === "string" && contentPiece.script_text) ||
      undefined,
    voiceover:
      (typeof storyDraft.voiceoverText === "string" && storyDraft.voiceoverText) ||
      (typeof contentPiece.voiceover_text === "string" && contentPiece.voiceover_text) ||
      undefined,
    onScreenText: asStringArray(storyDraft.overlayText),
    captionText:
      (typeof storyDraft.caption === "string" && storyDraft.caption) ||
      (typeof contentPiece.caption === "string" && contentPiece.caption) ||
      undefined,
    hashtags: asStringArray(storyDraft.hashtags),
    thumbnailDirection: typeof storyDraft.thumbnailDirection === "string" ? storyDraft.thumbnailDirection : undefined,
    notes: typeof metadata.notes === "string" ? metadata.notes : undefined,
    manualAssetId:
      (typeof metadata.manualAssetId === "string" && metadata.manualAssetId) ||
      (typeof sourceMetadata.manualAssetId === "string" && sourceMetadata.manualAssetId) ||
      undefined,
    createdAt: typeof generation.created_at === "string" ? generation.created_at : undefined,
    updatedAt: typeof generation.updated_at === "string" ? generation.updated_at : undefined,
  };
}
