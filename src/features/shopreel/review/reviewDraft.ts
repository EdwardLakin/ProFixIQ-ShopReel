
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

function stringFromRecord(record: UnknownRecord, key: string): string | undefined {

  const value = record[key];

  return typeof value === "string" && value.trim().length > 0 ? value : undefined;

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

  manualAssetFiles: string[];

  campaignAngle?: string;

  primaryCta?: string;

  alternateHooks: string[];

  platformOutputs: Array<{

    platformId: ShopReelPlatformId;

    platformLabel: string;

    intentLabel: string;

    hook: string;

    body: string;

    cta: string;

    caption: string;

    hashtags: string[];

  }>;

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

  const storyDraftMetadata = asRecord(storyDraft.metadata);

  const metadata = asRecord(generation.generation_metadata);

  const sourceMetadata = asRecord(input.storySource?.metadata ?? null);

  const contentPiece = asRecord(input.contentPiece ?? null);

  const creativeBrief = asRecord(metadata.creativeBrief ?? sourceMetadata.creativeBrief ?? storyDraftMetadata.creativeBrief);

  const prompt =

    stringFromRecord(storyDraft, "sourceText") ||

    (typeof input.storySource?.description === "string" && input.storySource.description) ||

    stringFromRecord(metadata, "prompt") ||

    "";

  const platforms = platformIdsFrom(metadata.platformIds ?? sourceMetadata.platformIds);

  const platformOutputsRaw = asRecord(storyDraft.platformOutputs);

  const platformOutputs = platforms.map((platformId) => {

    const payload = asRecord(platformOutputsRaw[platformId]);

    const label =

      platformId === "instagram_reels"

        ? "Instagram"

        : platformId === "facebook_reels"

          ? "Facebook"

          : platformId === "tiktok"

            ? "TikTok"

            : "YouTube Shorts";

    const intentLabel =

      platformId === "instagram_reels"

        ? "Hook-first caption"

        : platformId === "facebook_reels"

          ? "Trust-building post"

          : platformId === "tiktok"

            ? "Short-form social copy"

            : "Shorts-ready copy";

    return {

      platformId,

      platformLabel: label,

      intentLabel,

      hook: stringFromRecord(payload, "hook") ?? "",

      body: stringFromRecord(payload, "body") ?? "",

      cta: stringFromRecord(payload, "cta") ?? "",

      caption: stringFromRecord(payload, "caption") ?? "",

      hashtags: asStringArray(payload.hashtags),

    };

  });

  const alternateHooks =

    asStringArray(metadata.alternateHooks).length > 0

      ? asStringArray(metadata.alternateHooks)

      : asStringArray(storyDraftMetadata.alternateHooks).length > 0

        ? asStringArray(storyDraftMetadata.alternateHooks)

        : asStringArray(creativeBrief.alternateHooks);

  return {

    generationId: String(generation.id ?? ""),

    sourceId: stringFromRecord(generation, "story_source_id"),

    contentPieceId: stringFromRecord(generation, "content_piece_id"),

    prompt,

    audience:

      stringFromRecord(metadata, "audience") ||

      stringFromRecord(sourceMetadata, "audience") ||

      stringFromRecord(creativeBrief, "audience"),

    platforms,

    status: stringFromRecord(generation, "status") ?? "draft",

    conceptTitle:

      stringFromRecord(storyDraft, "title") ||

      stringFromRecord(contentPiece, "title") ||

      stringFromRecord(creativeBrief, "productName"),

    hook:

      stringFromRecord(storyDraft, "hook") ||

      stringFromRecord(contentPiece, "hook"),

    script:

      stringFromRecord(storyDraft, "scriptText") ||

      stringFromRecord(contentPiece, "script_text"),

    voiceover:

      stringFromRecord(storyDraft, "voiceoverText") ||

      stringFromRecord(contentPiece, "voiceover_text"),

    onScreenText: asStringArray(storyDraft.overlayText),

    captionText:

      stringFromRecord(storyDraft, "caption") ||

      stringFromRecord(contentPiece, "caption"),

    hashtags: asStringArray(storyDraft.hashtags),

    thumbnailDirection: stringFromRecord(storyDraft, "thumbnailDirection"),

    notes: stringFromRecord(metadata, "notes"),

    manualAssetId:

      stringFromRecord(metadata, "manualAssetId") ||

      stringFromRecord(sourceMetadata, "manualAssetId"),

    manualAssetFiles: asStringArray(metadata.manualAssetFiles),

    campaignAngle:

      stringFromRecord(metadata, "positioningSummary") ||

      stringFromRecord(storyDraftMetadata, "positioningSummary") ||

      stringFromRecord(creativeBrief, "positioningSummary"),

    primaryCta:

      stringFromRecord(creativeBrief, "ctaGoal") ||

      stringFromRecord(storyDraft, "cta"),

    alternateHooks,

    platformOutputs,

    createdAt: stringFromRecord(generation, "created_at"),

    updatedAt: stringFromRecord(generation, "updated_at"),

  };

}

