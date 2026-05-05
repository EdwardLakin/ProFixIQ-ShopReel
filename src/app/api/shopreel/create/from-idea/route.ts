import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import {
  DEFAULT_SHOPREEL_PLATFORM_IDS,
  SHOPREEL_PLATFORM_PRESETS,
  type ShopReelPlatformId,
} from "@/features/shopreel/platforms/presets";

import { getEditorPath } from "@/features/shopreel/lib/editorPaths";
type Body = {
  idea?: string;
  prompt?: string;
  audience?: string;
  platformFocus?: "instagram" | "tiktok" | "youtube" | "facebook" | "multi";
  tone?: "professional" | "educational" | "friendly" | "direct" | "confident" | "high-energy";
  platformIds?: ShopReelPlatformId[];
  manualAssetId?: string | null;
};

const PLATFORM_ID_SET = new Set<ShopReelPlatformId>(
  SHOPREEL_PLATFORM_PRESETS.map((platform) => platform.id),
);

function makeId(prefix: string) {
  return `${prefix}:${crypto.randomUUID()}`;
}

function firstSentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const parts = trimmed.split(/[.!?]/).map((x) => x.trim()).filter(Boolean);
  return parts[0] ?? trimmed;
}

function buildHook(idea: string) {
  const sentence = firstSentence(idea);
  if (!sentence) return "Here’s the quick breakdown.";
  if (sentence.length <= 90) return sentence;
  return `${sentence.slice(0, 87).trim()}...`;
}

function buildTitle(idea: string) {
  const sentence = firstSentence(idea);
  if (!sentence) return "Creator story";
  return sentence.length <= 64 ? sentence : `${sentence.slice(0, 61).trim()}...`;
}

function buildCaption(input: {
  idea: string;
  audience: string;
}) {
  const base = input.idea.trim();
  const audience = input.audience.trim();
  return audience
    ? `${base}\n\nMade for: ${audience}`
    : base;
}

function buildDraft(input: {
  shopId: string;
  sourceId: string;
  idea: string;
  audience: string;
  tone: Body["tone"];
  platformFocus: NonNullable<Body["platformFocus"]>;
  platformIds: ShopReelPlatformId[];
}) {
  const hook = buildHook(input.idea);
  const title = buildTitle(input.idea);
  const caption = buildCaption({
    idea: input.idea,
    audience: input.audience,
  });

  const targetChannels =
    input.platformFocus === "instagram"
      ? ["instagram_reel"]
      : input.platformFocus === "tiktok"
        ? ["tiktok_video"]
        : input.platformFocus === "youtube"
          ? ["youtube_short"]
          : input.platformFocus === "facebook"
            ? ["facebook_video"]
            : ["instagram_reel", "tiktok_video", "youtube_short", "facebook_video"];

  const sceneIdeas = [
    {
      role: "hook",
      title: "Hook",
      overlayText: hook,
      voiceoverText: hook,
      durationSeconds: 3,
    },
    {
      role: "context",
      title: "Context",
      overlayText: "What this is about",
      voiceoverText: input.idea.trim(),
      durationSeconds: 5,
    },
    {
      role: "demo",
      title: "Show or explain",
      overlayText: "Show the product, process, or proof",
      voiceoverText: "Show the key details, examples, or proof points here.",
      durationSeconds: 6,
    },
    {
      role: "takeaway",
      title: "Takeaway",
      overlayText: "What matters most",
      voiceoverText: "Summarize the main takeaway clearly and quickly.",
      durationSeconds: 4,
    },
    {
      role: "cta",
      title: "CTA",
      overlayText: "Follow for more",
      voiceoverText: "Follow for more, and check the link or caption for details.",
      durationSeconds: 3,
    },
  ];
  const platformOutputs = Object.fromEntries(
    input.platformIds.map((platformId) => {
      const isInstagram = platformId === "instagram_reels";
      const label = isInstagram ? "Instagram" : platformId === "facebook_reels" ? "Facebook" : platformId;
      const body = isInstagram
        ? `Turn this into a punchy ${label} post with one proof point and one clear benefit.`
        : `Turn this into a practical ${label} post with clear context, value, and what to do next.`;
      const cta = isInstagram ? "Save this and DM us to see it in action." : "Comment or message us to get the full breakdown.";
      const hashtags = isInstagram
        ? ["#creatorbusiness", "#contentstrategy", "#productlaunch", "#socialmedia"]
        : ["#smallbusinessmarketing", "#contentmarketing", "#launchstrategy"];
      return [platformId, { hook, body, cta, caption: `${hook}\n\n${input.idea.trim()}\n\n${cta}`, hashtags }];
    }),
  );

  return {
    id: makeId("draft"),
    shopId: input.shopId,
    sourceId: input.sourceId,
    sourceKind: "creator_idea",
    title,
    hook,
    caption,
    cta: "Follow for more",
    hashtags: [],
    tone: input.tone ?? "confident",
    targetChannels,
    targetDurationSeconds: 21,
    summary: input.idea.trim(),
    voiceoverText: sceneIdeas.map((scene) => scene.voiceoverText).join(" "),
    scriptText: sceneIdeas.map((scene) => scene.voiceoverText).join("\n"),
    scenes: sceneIdeas.map((scene, index) => ({
      id: makeId(`scene${index + 1}`),
      role: scene.role,
      title: scene.title,
      overlayText: scene.overlayText,
      voiceoverText: scene.voiceoverText,
      durationSeconds: scene.durationSeconds,
      media: [],
      metadata: {
        sourceAssetCount: 0,
        creatorMode: true,
      },
    })),
    metadata: {
      creatorMode: true,
      audience: input.audience.trim() || null,
      platformFocus: input.platformFocus,
      sourceOrigin: "creator_mode",
    },
    platformOutputs,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const idea = (body.prompt ?? body.idea ?? "").trim();
    const audience = body.audience?.trim() ?? "";

    if (!idea) {
      return NextResponse.json(
        { ok: false, error: "prompt is required" },
        { status: 400 },
      );
    }

    const authSupabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to create content." },
        { status: 401 },
      );
    }

    let shopId: string | null = null;
    try {
      shopId = await getCurrentShopId();
    } catch {
      shopId = null;
    }

    const supabase = createAdminClient();
    const submittedPlatformIds = body.platformIds ?? [];
    const platformIds = submittedPlatformIds.filter((id): id is ShopReelPlatformId =>
      PLATFORM_ID_SET.has(id),
    );
    const normalizedPlatformIds =
      platformIds.length > 0 ? platformIds : DEFAULT_SHOPREEL_PLATFORM_IDS;

    const now = new Date().toISOString();
    const sourceId = crypto.randomUUID();
    const contentPieceId = shopId ? crypto.randomUUID() : null;
    const generationId = crypto.randomUUID();

    const draft = buildDraft({
      shopId: shopId ?? user.id,
      sourceId,
      idea,
      audience,
      tone: body.tone ?? "confident",
      platformFocus: body.platformFocus ?? "multi",
      platformIds: normalizedPlatformIds,
    });

    const { error: sourceError } = await supabase
      .from("shopreel_story_sources")
      .insert({
        id: sourceId,
        shop_id: shopId,
        title: draft.title,
        description: idea,
        kind: "creator_idea",
        origin: "creator_mode",
        generation_mode: "assisted",
        tags: ["creator", "idea"],
        metadata: {
          creatorMode: true,
          audience: audience || null,
          platformFocus: body.platformFocus ?? "multi",
          platformIds: normalizedPlatformIds,
          manualAssetId: body.manualAssetId ?? null,
        },
        created_at: now,
        updated_at: now,
      });

    if (sourceError) {
      throw new Error(sourceError.message);
    }

    if (shopId && contentPieceId) {
      const { error: contentPieceError } = await supabase
        .from("content_pieces")
        .insert({
          id: contentPieceId,
          tenant_shop_id: shopId,
          source_shop_id: shopId,
          source_system: "shopreel",
          title: draft.title,
          hook: draft.hook,
          caption: draft.caption,
          cta: draft.cta,
          script_text: draft.scriptText,
          voiceover_text: draft.voiceoverText,
          status: "draft",
          content_type: "creator_story",
          metadata: {
            creatorMode: true,
            source_kind: "creator_idea",
          },
          platform_targets: draft.targetChannels,
          created_at: now,
          updated_at: now,
        });

      if (contentPieceError) {
        throw new Error(contentPieceError.message);
      }
    }

    const { error: generationError } = await supabase
      .from("shopreel_story_generations")
      .insert({
        id: generationId,
        shop_id: shopId,
        story_source_id: sourceId,
        content_piece_id: contentPieceId,
        reel_plan_id: null,
        render_job_id: null,
        status: "draft",
        story_draft: draft,
        generation_metadata: {
          creatorMode: true,
          source_system: "shopreel",
          audience: audience || null,
          platformFocus: body.platformFocus ?? "multi",
          platformIds: normalizedPlatformIds,
          manualAssetId: body.manualAssetId ?? null,
        },
        created_by: user.id,
        created_at: now,
        updated_at: now,
      });

    if (generationError) {
      throw new Error(generationError.message);
    }

    return NextResponse.json({
      ok: true,
      sourceId,
      contentPieceId,
      generationId,
      editorUrl: getEditorPath("video", generationId),
      reviewUrl: `/shopreel/review/${generationId}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create from idea";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
