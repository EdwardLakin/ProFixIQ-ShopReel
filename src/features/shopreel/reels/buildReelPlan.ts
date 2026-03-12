import { createAdminClient } from "@/lib/supabase/server";
import { buildReelPlan as buildReelScenePlan } from "../reelbuilder/buildReelPlan";
import { buildStoryDraftFromSource } from "../story-builder";
import type { StorySource } from "../story-sources";

type ReelShot = {
  order: number;
  type: string;
  direction: string;
  overlayText: string;
  durationSeconds: number;
};

type ContentPieceRow = {
  metadata: Record<string, unknown> | null;
};

function coerceStorySource(value: unknown): StorySource | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.shopId !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.kind !== "string" ||
    !Array.isArray(candidate.assets) ||
    !Array.isArray(candidate.tags) ||
    !Array.isArray(candidate.refs) ||
    !Array.isArray(candidate.notes)
  ) {
    return null;
  }

  return candidate as unknown as StorySource;
}

export async function buildReelPlan(videoId: string, shopId: string) {
  const supabase = createAdminClient();

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("id, title, hook, voiceover_text, caption")
    .eq("id", videoId)
    .single();

  if (videoError || !video) {
    throw new Error(videoError?.message ?? "Video not found");
  }

  const { data: contentPieceRow } = await supabase
    .from("content_pieces")
    .select("metadata")
    .eq("id", videoId)
    .maybeSingle();

  const contentPiece = (contentPieceRow ?? null) as ContentPieceRow | null;

  const metadata =
    contentPiece?.metadata &&
    typeof contentPiece.metadata === "object" &&
    !Array.isArray(contentPiece.metadata)
      ? contentPiece.metadata
      : {};

  const embeddedSource = coerceStorySource(metadata.story_source);
  const draft = embeddedSource ? buildStoryDraftFromSource(embeddedSource) : null;

  const scenePlan = draft ? buildReelScenePlan(draft).scenePlan : null;

  const shots: ReelShot[] =
    scenePlan && scenePlan.length > 0
      ? scenePlan.map((scene) => ({
          order: scene.order,
          type: scene.role,
          direction: scene.direction,
          overlayText: scene.overlayText,
          durationSeconds: scene.durationSeconds,
        }))
      : [
          {
            order: 1,
            type: "intro",
            direction: "Wide shot of vehicle entering bay",
            overlayText: video.hook ?? "Here’s what happened in the shop today.",
            durationSeconds: 3,
          },
          {
            order: 2,
            type: "inspection",
            direction: "Close-up of technician checking the issue area",
            overlayText: "Inspection and diagnosis",
            durationSeconds: 5,
          },
          {
            order: 3,
            type: "finding",
            direction: "Tight shot of failed or worn component",
            overlayText: "What we found",
            durationSeconds: 4,
          },
          {
            order: 4,
            type: "repair",
            direction: "Hands-on repair or service process clip",
            overlayText: "Repair in progress",
            durationSeconds: 6,
          },
          {
            order: 5,
            type: "result",
            direction: "Completed vehicle / final reveal shot",
            overlayText: "Final result",
            durationSeconds: 4,
          },
        ];

  const overlays = shots.map((shot) => ({
    order: shot.order,
    text: shot.overlayText,
  }));

  const planJson = {
    source: embeddedSource ? "story_source" : "legacy_video",
    storyDraft: draft,
    shots,
    overlays,
    musicDirection: "Confident, modern, clean shop energy",
    estimatedDurationSeconds: shots.reduce((sum, shot) => sum + shot.durationSeconds, 0),
  };

  const { data: plan, error: planError } = await supabase
    .from("reel_plans")
    .insert(
      {
        video_id: videoId,
        shop_id: shopId,
        title: video.title,
        hook: video.hook,
        voiceover_text: video.voiceover_text,
        plan_json: planJson,
      } as never,
    )
    .select("id")
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message ?? "Failed to create reel plan");
  }

  return {
    reelPlanId: plan.id,
    shots,
    overlays,
  };
}
