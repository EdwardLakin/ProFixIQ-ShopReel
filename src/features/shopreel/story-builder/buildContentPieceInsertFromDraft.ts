import type { Json, TablesInsert } from "@/types/supabase";
import type { StoryDraft } from "./types";

type ContentPieceInsert = TablesInsert<"content_pieces">;

function mapChannelsToPlatforms(
  channels: StoryDraft["targetChannels"],
): ContentPieceInsert["platform_targets"] {
  const platforms = new Set<string>();

  for (const channel of channels) {
    switch (channel) {
      case "instagram_reel":
        platforms.add("instagram");
        break;
      case "facebook_video":
        platforms.add("facebook");
        break;
      case "youtube_short":
        platforms.add("youtube");
        break;
      case "tiktok_video":
        platforms.add("tiktok");
        break;
      default:
        break;
    }
  }

  return Array.from(platforms);
}

function mapSourceKindToContentType(sourceKind: StoryDraft["sourceKind"]): string {
  switch (sourceKind) {
    case "repair_completed":
      return "repair_story";
    case "inspection_completed":
      return "inspection_highlight";
    case "before_after":
      return "before_after";
    case "educational_insight":
    case "expert_tip":
      return "educational_tip";
    default:
      return "workflow_demo";
  }
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

export function buildContentPieceInsertFromDraft(input: {
  shopId: string;
  draft: StoryDraft;
  templateId?: string | null;
  sourceSystem?: string | null;
}): ContentPieceInsert {
  const { shopId, draft } = input;

  return {
    tenant_shop_id: shopId,
    source_shop_id: shopId,
    source_system: input.sourceSystem ?? "shopreel",
    title: draft.title,
    status: "draft",
    content_type: mapSourceKindToContentType(draft.sourceKind),
    hook: draft.hook ?? null,
    caption: draft.caption ?? null,
    cta: draft.cta ?? null,
    script_text: draft.scriptText ?? null,
    voiceover_text: draft.voiceoverText ?? null,
    platform_targets: mapChannelsToPlatforms(draft.targetChannels),
    template_id: input.templateId ?? null,
    metadata: toJson({
      story_source_id: draft.sourceId,
      story_source_kind: draft.sourceKind,
      story_draft: draft,
      story_scene_count: draft.scenes.length,
      story_target_duration_seconds: draft.targetDurationSeconds ?? null,
      story_tone: draft.tone,
    }),
  };
}
