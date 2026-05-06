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
import { openai } from "@/features/ai/server/openai";
import { SHOPREEL_AI_MODELS } from "@/features/shopreel/ai/modelConfig";
import {
  assertManualAssetAccess,
  buildCreativeBrief,
  extractScreenshotContext,
  type CreativeBrief,
} from "@/features/shopreel/manual/lib/creativeBrief";

type Body = {
  idea?: string;
  prompt?: string;
  audience?: string;
  platformFocus?: "instagram" | "tiktok" | "youtube" | "facebook" | "multi";
  tone?: "professional" | "educational" | "friendly" | "direct" | "confident" | "high-energy";
  platformIds?: ShopReelPlatformId[];
  manualAssetId?: string | null;
  manualAssetIds?: string[];
};

type PlatformOutput = {
  hook: string;
  body: string;
  cta: string;
  caption: string;
  hashtags: string[];
};

type GeneratedDraftPayload = {
  title: string;
  hook: string;
  summary: string;
  cta: string;
  caption: string;
  scriptText: string;
  voiceoverText: string;
  platformOutputs: Partial<Record<ShopReelPlatformId, PlatformOutput>>;
  alternateHooks: string[];
};

type FinalSocialCopyPayload = {
  instagram: {
    hook: string;
    caption: string;
    cta: string;
    hashtags: string[];
  };
  facebook: {
    hook: string;
    body: string;
    cta: string;
    hashtags: string[];
  };
  alternateHooks: string[];
};

const PLATFORM_ID_SET = new Set<ShopReelPlatformId>(
  SHOPREEL_PLATFORM_PRESETS.map((platform) => platform.id),
);

function makeId(prefix: string) {
  return `${prefix}:${crypto.randomUUID()}`;
}

function similarity(a: string, b: string): number {
  const aTokens = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const bTokens = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }

  return overlap / Math.max(aTokens.size, bTokens.size);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizePlatformOutput(value: unknown, fallback: PlatformOutput): PlatformOutput {
  const record = asRecord(value);
  return {
    hook: asString(record.hook, fallback.hook),
    body: asString(record.body, fallback.body),
    cta: asString(record.cta, fallback.cta),
    caption: asString(record.caption, fallback.caption),
    hashtags: asStringArray(record.hashtags),
  };
}

function defaultHashtags(platformId: ShopReelPlatformId, brief: CreativeBrief): string[] {
  const productToken = brief.productName
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim();

  if (platformId === "instagram_reels") {
    return [
      productToken ? `#${productToken}` : "#productlaunch",
      "#flatratetech",
      "#automotivetech",
      "#mechaniclife",
      "#payday",
      "#shoplife",
    ];
  }

  if (platformId === "tiktok") {
    return ["#flatratetech", "#mechaniclife", "#worktok", "#payday"];
  }

  if (platformId === "youtube_shorts") {
    return ["#Shorts", "#mechaniclife", "#payday"];
  }

  return [];
}

function strengthenCta(platformId: ShopReelPlatformId, cta: string, brief: CreativeBrief): string {
  const normalized = cta.trim();

  if (
    !normalized ||
    /drive awareness|learn more about|prompt technicians|not provided/i.test(normalized)
  ) {
    if (platformId === "instagram_reels") {
      return `DM “${brief.productName || "INFO"}” for early access or save this before payday.`;
    }

    if (platformId === "facebook_reels") {
      return `Comment or message us to see how ${brief.productName || "this"} helps techs keep payday proof organized.`;
    }

    return "Save this and create your first proof trail before payday.";
  }

  return normalized;
}


export function looksLikeStrategyNotes(value: string): boolean {
  const text = value.toLowerCase();

  return (
    text.includes("position the content") ||
    text.includes("campaign should") ||
    text.includes("the campaign should") ||
    text.includes("this strategy") ||
    text.includes("content should") ||
    text.includes("focus on") ||
    text.includes("target audience") ||
    text.includes("creative direction") ||
    text.includes("messaging strategy") ||
    text.includes("the goal is to") ||
    text.includes("why this works") ||
    text.includes("strategy:") ||
    text.includes("cta:") ||
    text.includes("angle:") ||
    text.includes("use this platform copy") ||
    text.includes("creative brief") ||
    text.includes("content around") ||
    text.includes("prompt technicians") ||
    text.includes("encourage technicians") ||
    text.includes("generate a") ||
    text.includes("create a facebook") ||
    text.includes("create an instagram") ||
    text.includes("the launch content") ||
    text.includes("the focus is") ||
    text.includes("should be positioned") ||
    text.includes("reduce tension") ||
    text.includes("not frame shops") ||
    text.includes("use examples like") ||
    text.includes("encourage viewers")
  );
}

function normalizeFinalSocialCopyPayload(value: unknown, brief: CreativeBrief): FinalSocialCopyPayload {
  const record = asRecord(value);
  const instagram = asRecord(record.instagram);
  const facebook = asRecord(record.facebook);
  return {
    instagram: {
      hook: asString(instagram.hook, "Stop losing proof you already earned."),
      caption: asString(instagram.caption, brief.primaryValueProp),
      cta: asString(instagram.cta, brief.ctaGoal),
      hashtags: asStringArray(instagram.hashtags),
    },
    facebook: {
      hook: asString(facebook.hook, "When records are scattered, payday gets harder."),
      body: asString(facebook.body, brief.positioningSummary),
      cta: asString(facebook.cta, brief.ctaGoal),
      hashtags: asStringArray(facebook.hashtags),
    },
    alternateHooks: asStringArray(record.alternateHooks),
  };
}

async function generateFinalSocialCopy(brief: CreativeBrief, idea: string): Promise<FinalSocialCopyPayload | null> {
  const response = await openai.responses.create({
    model: SHOPREEL_AI_MODELS.text,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are writing the final post copy the user will paste into Instagram/Facebook. " +
              "Do not include strategy, reasoning, labels, campaign notes, or meta commentary. " +
              "Do not output tokens like CTA:, Hook:, caption:, why this works, campaign should, or position the content. " +
              "Output only final copy fields.",
          },
        ],
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: `Brief: ${JSON.stringify(brief)}` },
          { type: "input_text", text: `Idea context: ${idea}` },
          {
            type: "input_text",
            text:
              "Return one valid JSON object only with shape: {instagram:{hook,caption,cta,hashtags},facebook:{hook,body,cta,hashtags},alternateHooks:string[]}",
          },
        ],
      },
    ],
    text: { format: { type: "json_object" } },
  });

  try {
    const parsed = normalizeFinalSocialCopyPayload(JSON.parse(response.output_text || "{}"), brief);
    const combined = [
      parsed.instagram.hook,
      parsed.instagram.caption,
      parsed.facebook.hook,
      parsed.facebook.body,
    ].join(" ");
    if (looksLikeStrategyNotes(combined) || similarity(combined, idea) > 0.6) return null;
    return parsed;
  } catch {
    return null;
  }
}

function inferProductName(brief: CreativeBrief): string {
  const product = brief.productName?.trim();
  if (product && !/^unknown|this product$/i.test(product)) return product;
  return "this tool";
}

export function buildPlatformFallbackCopy(input: {
  platformId: ShopReelPlatformId;
  brief: CreativeBrief;
}): PlatformOutput {
  const productName = inferProductName(input.brief);
  const pain = input.brief.primaryPainPoint || "important work gets forgotten when it is time to post, report, or get paid";
  const value = input.brief.primaryValueProp || `${productName} helps people keep proof organized and ready when it matters`;
  const promise = input.brief.emotionalPromise || "more confidence, less guesswork";
  const proofPoints = input.brief.proofPoints?.filter(Boolean).slice(0, 3) ?? [];

  if (input.platformId === "instagram_reels") {
    const hook = "Your proof should be ready before the question comes up.";
    const body = [
      `${productName} helps turn scattered details into a clean proof trail.`,
      proofPoints.length > 0
        ? `Use it to ${proofPoints.join(", ").toLowerCase()}.`
        : value,
      `Less guessing. More ${promise.toLowerCase()}.`,
    ].join("\n");

    const cta = `Save this and check out ${productName} if you want proof ready before it matters.`;
    const hashtags = defaultHashtags(input.platformId, input.brief);

    return {
      hook,
      body,
      cta,
      caption: [hook, body, cta, hashtags.join(" ")].join("\n\n"),
      hashtags,
    };
  }

  if (input.platformId === "facebook_reels") {
    const hook = "Small missing details can turn into real frustration later.";
    const body = [
      `${productName} is built for people who want a simple way to keep important work records organized.`,
      `Instead of relying on memory, ${productName} helps keep the proof, notes, and context in one place so the conversation is easier when something does not line up.`,
      `The value is simple: ${value}.`,
    ].join("\n\n");

    const cta = `Message us or follow along if you want to see how ${productName} works.`;

    return {
      hook,
      body,
      cta,
      caption: [hook, body, cta].join("\n\n"),
      hashtags: [],
    };
  }

  return {
    hook: value,
    body: `${pain}\n\n${value}`,
    cta: input.brief.ctaGoal || "Learn more.",
    caption: `${value}\n\n${input.brief.ctaGoal || "Learn more."}`,
    hashtags: defaultHashtags(input.platformId, input.brief),
  };
}

export function forceUsablePlatformCopy(input: {
  platformId: ShopReelPlatformId;
  output: PlatformOutput;
  brief: CreativeBrief;
  originalPrompt: string;
}): PlatformOutput {
  const combined = [input.output.hook, input.output.body, input.output.cta, input.output.caption].join(" ");
  const tooSimilarToPrompt = similarity(combined, input.originalPrompt) > 0.48;
  const strategyNotes =
    looksLikeStrategyNotes(input.output.hook) ||
    looksLikeStrategyNotes(input.output.body) ||
    looksLikeStrategyNotes(input.output.cta) ||
    looksLikeStrategyNotes(input.output.caption);

  const tooGeneric =
    input.output.hook.trim().length < 8 ||
    input.output.body.trim().length < 30 ||
    input.output.cta.trim().length < 8;

  if (tooSimilarToPrompt || strategyNotes || tooGeneric) {
    return buildPlatformFallbackCopy({
      platformId: input.platformId,
      brief: input.brief,
    });
  }

  return input.output;
}

function ensureDistinctPlatformTone(input: {
  platformId: ShopReelPlatformId;
  output: PlatformOutput;
  brief: CreativeBrief;
}): PlatformOutput {
  const { platformId, output, brief } = input;
  const cta = strengthenCta(platformId, output.cta, brief);
  const hashtags = output.hashtags.length > 0 ? output.hashtags : defaultHashtags(platformId, brief);

  if (platformId === "instagram_reels") {
    return {
      ...output,
      hook: output.hook.length > 80 ? output.hook.slice(0, 77).trim() + "..." : output.hook,
      body:
        output.body ||
        `${brief.primaryPainPoint} ${brief.primaryValueProp}`.trim(),
      cta,
      caption:
        output.caption ||
        [output.hook, output.body, cta, hashtags.join(" ")].filter(Boolean).join("\n\n"),
      hashtags,
    };
  }

  if (platformId === "facebook_reels") {
    return {
      ...output,
      body:
        output.body && output.body.length > 80
          ? output.body
          : `${brief.positioningSummary}\n\n${brief.primaryValueProp}\n\n${brief.emotionalPromise}`.trim(),
      cta,
      caption:
        output.caption ||
        [output.hook, output.body, cta].filter(Boolean).join("\n\n"),
      hashtags,
    };
  }

  return {
    ...output,
    cta,
    hashtags,
  };
}

export function normalizeGeneratedPayload(value: unknown, brief: CreativeBrief, platformIds: ShopReelPlatformId[], originalPrompt: string): GeneratedDraftPayload {
  const record = asRecord(value);
  const fallbackHook = brief.alternateHooks[0] ?? "Turn proof into confidence.";
  const fallbackCta = brief.ctaGoal || "Learn more.";
  const fallbackCaption = `${brief.positioningSummary}\n\n${fallbackCta}`;

  const platformOutputsRaw = asRecord(record.platformOutputs);
  const platformOutputs: Partial<Record<ShopReelPlatformId, PlatformOutput>> = {};

  for (const platformId of platformIds) {
    const isInstagram = platformId === "instagram_reels";
    const fallback: PlatformOutput = {
      hook: fallbackHook,
      body: isInstagram
        ? `${brief.primaryValueProp} ${brief.emotionalPromise}`.trim()
        : `${brief.positioningSummary} ${brief.primaryValueProp}`.trim(),
      cta: fallbackCta,
      caption: fallbackCaption,
      hashtags: isInstagram ? ["#contentmarketing", "#productlaunch", "#smallbusiness"] : [],
    };
    const normalizedOutput = ensureDistinctPlatformTone({
      platformId,
      output: normalizePlatformOutput(platformOutputsRaw[platformId], fallback),
      brief,
    });

    platformOutputs[platformId] = forceUsablePlatformCopy({
      platformId,
      output: normalizedOutput,
      brief,
      originalPrompt,
    });
  }

  const instagramOutput = platformOutputs.instagram_reels;
  const baseCaption = instagramOutput?.caption || fallbackCaption;
  const baseHook = instagramOutput?.hook || fallbackHook;
  const baseScript = instagramOutput
    ? [instagramOutput.hook, instagramOutput.body, instagramOutput.cta].filter(Boolean).join("\n\n")
    : `${brief.primaryValueProp}\n\n${fallbackCta}`;

  return {
    title: asString(record.title, brief.productName),
    hook: asString(record.hook, fallbackHook),
    summary: asString(record.summary, brief.positioningSummary),
    cta: asString(record.cta, fallbackCta),
    caption: asString(record.caption, fallbackCaption),
    scriptText: looksLikeStrategyNotes(asString(record.scriptText, ""))
      ? baseScript
      : asString(record.scriptText, baseScript),
    voiceoverText: looksLikeStrategyNotes(asString(record.voiceoverText, ""))
      ? ""
      : asString(record.voiceoverText, ""),
    platformOutputs,
    alternateHooks: asStringArray(record.alternateHooks).length > 0
      ? asStringArray(record.alternateHooks)
      : brief.alternateHooks,
  };
}

async function generateDraftFromBrief(input: {
  idea: string;
  audience: string;
  platformIds: ShopReelPlatformId[];
  tone: string;
  brief: CreativeBrief;
  shopId: string;
  sourceId: string;
  platformFocus: NonNullable<Body["platformFocus"]>;
}) {
  const response = await openai.responses.create({
    model: SHOPREEL_AI_MODELS.text,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Return one valid JSON object only. Do not wrap it in markdown. Do not include commentary. Create final, ready-to-post social media copy from the creative brief. Do not write strategy notes, explanations, campaign instructions, or analysis. " +
              "Do not repeat or paraphrase the original user prompt as the post. Transform the idea into finished post copy. Write original polished marketing copy. " +
              "Instagram and Facebook must be meaningfully different when both are requested. " +
              "Instagram should be hook-first, punchy, shorter, CTA-forward, and include hashtags. " +
              "Facebook should be more explanatory, practical, trust-building, and use fewer or no hashtags. " +
              "Use screenshot context as factual support only. Do not invent unsupported product features.",
          },
          { type: "input_text", text: `Original user prompt, for context only: ${input.idea}` },
          { type: "input_text", text: `Creative brief: ${JSON.stringify(input.brief)}` },
          { type: "input_text", text: `Requested platform IDs: ${input.platformIds.join(", ")}` },
        ],
      },
    ],
    text: {
      format: { type: "json_object" },
    },
  });

  let parsed: GeneratedDraftPayload;
  try {
    parsed = normalizeGeneratedPayload(JSON.parse(response.output_text || "{}") as unknown, input.brief, input.platformIds, input.idea);
  } catch {
    parsed = normalizeGeneratedPayload({}, input.brief, input.platformIds, input.idea);
  }

  if (similarity(parsed.hook, input.idea) > 0.72 || similarity(parsed.caption, input.idea) > 0.72) {
    parsed.hook = input.brief.alternateHooks[0] ?? "Your work deserves proof.";
    parsed.caption = `${input.brief.positioningSummary}\n\n${input.brief.ctaGoal}`.trim();
  }

  if (looksLikeStrategyNotes(parsed.scriptText) || similarity(parsed.scriptText, input.idea) > 0.6) {
    const instagram = parsed.platformOutputs.instagram_reels;
    parsed.scriptText = instagram
      ? [instagram.hook, instagram.body, instagram.cta].filter(Boolean).join("\n\n")
      : `${input.brief.primaryValueProp}\n\n${input.brief.ctaGoal}`.trim();
  }

  if (looksLikeStrategyNotes(parsed.voiceoverText) || similarity(parsed.voiceoverText, input.idea) > 0.6) {
    parsed.voiceoverText = "";
  }

  const instagram = parsed.platformOutputs.instagram_reels;
  const facebook = parsed.platformOutputs.facebook_reels;
  if (
    instagram &&
    facebook &&
    similarity(
      `${instagram.hook} ${instagram.body} ${instagram.caption}`,
      `${facebook.hook} ${facebook.body} ${facebook.caption}`,
    ) > 0.8
  ) {
    parsed.platformOutputs.facebook_reels = {
      ...facebook,
      body: `${facebook.body}\n\nFor teams and technicians, the value is simple: clearer records, fewer payday surprises, and a practical way to talk through missing pay with evidence.`,
      hashtags: [],
    };
  }

  const finalSocialCopy = await generateFinalSocialCopy(input.brief, input.idea);
  if (finalSocialCopy) {
    parsed.alternateHooks = finalSocialCopy.alternateHooks.length > 0 ? finalSocialCopy.alternateHooks : parsed.alternateHooks;
    if (input.platformIds.includes("instagram_reels")) {
      parsed.platformOutputs.instagram_reels = forceUsablePlatformCopy({
        platformId: "instagram_reels",
        brief: input.brief,
        originalPrompt: input.idea,
        output: {
          hook: finalSocialCopy.instagram.hook,
          body: finalSocialCopy.instagram.caption,
          cta: finalSocialCopy.instagram.cta,
          caption: [finalSocialCopy.instagram.hook, finalSocialCopy.instagram.caption, finalSocialCopy.instagram.cta].join("\n\n"),
          hashtags: finalSocialCopy.instagram.hashtags,
        },
      });
    }

    if (input.platformIds.includes("facebook_reels")) {
      parsed.platformOutputs.facebook_reels = forceUsablePlatformCopy({
        platformId: "facebook_reels",
        brief: input.brief,
        originalPrompt: input.idea,
        output: {
          hook: finalSocialCopy.facebook.hook,
          body: finalSocialCopy.facebook.body,
          cta: finalSocialCopy.facebook.cta,
          caption: [finalSocialCopy.facebook.hook, finalSocialCopy.facebook.body, finalSocialCopy.facebook.cta].join("\n\n"),
          hashtags: finalSocialCopy.facebook.hashtags,
        },
      });
    }
  }

  const instagramPrimary = parsed.platformOutputs.instagram_reels;
  if (instagramPrimary) {
    parsed.caption = [instagramPrimary.hook, instagramPrimary.body, instagramPrimary.cta, instagramPrimary.hashtags.join(" ")]
      .filter(Boolean)
      .join("\n\n");
    parsed.hook = instagramPrimary.hook;
    if (!parsed.scriptText.trim()) {
      parsed.scriptText = [instagramPrimary.hook, instagramPrimary.body, instagramPrimary.cta].filter(Boolean).join("\n\n");
    }
  }

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

  return {
    id: makeId("draft"),
    shopId: input.shopId,
    sourceId: input.sourceId,
    sourceKind: "creator_idea",
    title: parsed.title,
    hook: parsed.hook,
    caption: parsed.caption,
    cta: parsed.cta,
    hashtags: [],
    tone: input.tone,
    targetChannels,
    targetDurationSeconds: 21,
    summary: parsed.summary,
    voiceoverText: parsed.voiceoverText,
    scriptText: parsed.scriptText,
    scenes: [],
    metadata: {
      creatorMode: true,
      audience: input.audience.trim() || null,
      platformFocus: input.platformFocus,
      sourceOrigin: "creator_mode",
      creativeBrief: input.brief,
      positioningSummary: input.brief.positioningSummary,
      alternateHooks: parsed.alternateHooks,
    },
    platformOutputs: parsed.platformOutputs,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const idea = (body.prompt ?? body.idea ?? "").trim();
    const audience = body.audience?.trim() ?? "";

    if (!idea) {
      return NextResponse.json({ ok: false, error: "prompt is required" }, { status: 400 });
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

    const manualAssetIds = Array.from(
      new Set(
        [
          body.manualAssetId,
          ...(Array.isArray(body.manualAssetIds) ? body.manualAssetIds : []),
        ].filter((id): id is string => typeof id === "string" && id.trim().length > 0),
      ),
    );

    for (const manualAssetId of manualAssetIds) {
      await assertManualAssetAccess({
        manualAssetId,
        userId: user.id,
        shopId,
      });
    }

    const now = new Date().toISOString();
    const sourceId = crypto.randomUUID();
    const contentPieceId = shopId ? crypto.randomUUID() : null;
    const generationId = crypto.randomUUID();

    const screenshotContext = manualAssetIds[0]
      ? await extractScreenshotContext({
          manualAssetId: manualAssetIds[0],
          userId: user.id,
          shopId,
        }).catch(() => null)
      : null;

    const creativeBrief = await buildCreativeBrief({
      prompt: idea,
      audience,
      platformIds: normalizedPlatformIds,
      tone: body.tone ?? "confident",
      screenshotContext,
    });

    const draft = await generateDraftFromBrief({
      shopId: shopId ?? user.id,
      sourceId,
      idea,
      audience,
      tone: body.tone ?? "confident",
      platformFocus: body.platformFocus ?? "multi",
      platformIds: normalizedPlatformIds,
      brief: creativeBrief,
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
          manualAssetId: manualAssetIds[0] ?? null,
          manualAssetIds,
          creativeBrief,
          screenshotContext,
        },
        created_at: now,
        updated_at: now,
      });

    if (sourceError) throw new Error(`Failed to create story source: ${sourceError.message}`);

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

      if (contentPieceError) throw new Error(`Failed to create content piece: ${contentPieceError.message}`);
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
          manualAssetId: manualAssetIds[0] ?? null,
          manualAssetIds,
          creativeBrief,
          screenshotContext,
          positioningSummary: creativeBrief.positioningSummary,
          alternateHooks: draft.metadata.alternateHooks,
        },
        created_by: user.id,
        created_at: now,
        updated_at: now,
      });

    if (generationError) throw new Error(`Failed to create generation: ${generationError.message}`);

    return NextResponse.json({
      ok: true,
      sourceId,
      contentPieceId,
      generationId,
      editorUrl: getEditorPath("video", generationId),
      reviewUrl: `/shopreel/review/${generationId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create from idea";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
