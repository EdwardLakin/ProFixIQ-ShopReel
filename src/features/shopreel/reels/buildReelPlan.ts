import { createAdminClient } from "@/lib/supabase/server";
import { buildReelPlan as buildReelScenePlan } from "../reelbuilder/buildReelPlan";
import type { StoryDraft } from "../story-builder/types";

type ReelShot = {
  order: number;
  type: string;
  direction: string;
  overlayText: string;
  durationSeconds: number;
};

function asStoryDraft(value: unknown): StoryDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as StoryDraft;
}

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export async function buildReelPlan(contentPieceId: string, shopId: string) {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const [{ data: pieceData, error: pieceError }, { data: generationData, error: generationError }] =
    await Promise.all([
      legacy
        .from("content_pieces")
        .select("id, title, body_text, metadata")
        .eq("id", contentPieceId)
        .maybeSingle(),
      legacy
        .from("shopreel_story_generations")
        .select("id, story_draft, generation_metadata, created_at")
        .eq("shop_id", shopId)
        .eq("content_piece_id", contentPieceId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (pieceError) {
    throw new Error(pieceError.message);
  }

  if (generationError) {
    throw new Error(generationError.message);
  }

  if (!pieceData) {
    throw new Error("Content piece not found");
  }

  const generation = generationData ?? null;
  const draft = asStoryDraft(generation?.story_draft ?? null);
  const pieceMetadata = objectRecord(pieceData.metadata);
  const scenePlan = draft ? buildReelScenePlan(draft).scenePlan : null;

  const fallbackHook =
    typeof pieceMetadata.hook === "string" ? pieceMetadata.hook : null;

  const fallbackVoiceover =
    typeof pieceMetadata.voiceover_text === "string"
      ? pieceMetadata.voiceover_text
      : typeof pieceData.body_text === "string"
        ? pieceData.body_text
        : null;

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
            direction: "Wide establishing shot",
            overlayText: fallbackHook ?? "Here’s what happened today.",
            durationSeconds: 3,
          },
          {
            order: 2,
            type: "context",
            direction: "Problem / setup context",
            overlayText: "Context and setup",
            durationSeconds: 4,
          },
          {
            order: 3,
            type: "process",
            direction: "Show the process or work in motion",
            overlayText: "What happened next",
            durationSeconds: 5,
          },
          {
            order: 4,
            type: "result",
            direction: "Reveal the result or takeaway",
            overlayText: "Final result",
            durationSeconds: 4,
          },
        ];

  const overlays = shots.map((shot) => ({
    order: shot.order,
    text: shot.overlayText,
  }));

  const planJson = {
    source: draft ? "shopreel_story_generation" : "content_piece",
    storyDraft: draft,
    shots,
    overlays,
    musicDirection: "Confident, modern, clean shop energy",
    estimatedDurationSeconds: shots.reduce((sum, shot) => sum + shot.durationSeconds, 0),
  };

  const { data: plan, error: planError } = await legacy
    .from("reel_plans")
    .insert(
      {
        video_id: contentPieceId,
        shop_id: shopId,
        title:
          draft?.title ??
          pieceData.title ??
          "ShopReel plan",
        hook: draft?.hook ?? fallbackHook,
        voiceover_text: draft?.voiceoverText ?? draft?.scriptText ?? fallbackVoiceover,
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
