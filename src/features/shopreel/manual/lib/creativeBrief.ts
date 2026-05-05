
import { openai } from "@/features/ai/server/openai";

import { createAdminClient } from "@/lib/supabase/server";

import { SHOPREEL_AI_MODELS } from "@/features/shopreel/ai/modelConfig";

import type { ShopReelPlatformId } from "@/features/shopreel/platforms/presets";

export type ScreenshotContext = {

  productName: string;

  productType: string;

  uiClues: string[];

  userActions: string[];

  likelyBenefit: string;

};

export type CreativeBrief = {

  productName: string;

  audience: string;

  primaryPainPoint: string;

  primaryValueProp: string;

  proofPoints: string[];

  emotionalPromise: string;

  tone: string;

  ctaGoal: string;

  platformStrategy: Record<string, string>;

  positioningSummary: string;

  alternateHooks: string[];

  screenshotContext?: ScreenshotContext;

};

type ManualAssetFile = {

  storage_path: string;

  mime_type: string | null;

  file_name: string | null;

};

type ManualAssetOwner = {

  id: string;

  shop_id: string | null;

  created_by: string | null;

};

function safeJsonParse<T>(value: string | undefined, fallback: T): T {

  if (!value) return fallback;

  try {

    return JSON.parse(value) as T;

  } catch {

    return fallback;

  }

}

function normalizeStringArray(value: unknown): string[] {

  return Array.isArray(value)

    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)

    : [];

}

function normalizeScreenshotContext(value: Partial<ScreenshotContext>): ScreenshotContext {

  return {

    productName: typeof value.productName === "string" && value.productName.trim() ? value.productName : "Unknown product",

    productType: typeof value.productType === "string" && value.productType.trim() ? value.productType : "Digital product",

    uiClues: normalizeStringArray(value.uiClues),

    userActions: normalizeStringArray(value.userActions),

    likelyBenefit: typeof value.likelyBenefit === "string" && value.likelyBenefit.trim() ? value.likelyBenefit : "Helps users complete their workflow with more confidence.",

  };

}

function normalizeCreativeBrief(value: Partial<CreativeBrief>, input: {

  prompt: string;

  audience?: string;

  tone?: string;

  screenshotContext?: ScreenshotContext | null;

}): CreativeBrief {

  const platformStrategy =

    value.platformStrategy && typeof value.platformStrategy === "object" && !Array.isArray(value.platformStrategy)

      ? Object.fromEntries(

          Object.entries(value.platformStrategy).filter((entry): entry is [string, string] => typeof entry[1] === "string"),

        )

      : {};

  return {

    productName: typeof value.productName === "string" && value.productName.trim() ? value.productName : input.screenshotContext?.productName ?? "This product",

    audience: typeof value.audience === "string" && value.audience.trim() ? value.audience : input.audience || "Target audience",

    primaryPainPoint: typeof value.primaryPainPoint === "string" && value.primaryPainPoint.trim() ? value.primaryPainPoint : "The audience needs a clearer, faster way to solve this problem.",

    primaryValueProp: typeof value.primaryValueProp === "string" && value.primaryValueProp.trim() ? value.primaryValueProp : input.screenshotContext?.likelyBenefit ?? input.prompt,

    proofPoints: normalizeStringArray(value.proofPoints),

    emotionalPromise: typeof value.emotionalPromise === "string" && value.emotionalPromise.trim() ? value.emotionalPromise : "More confidence and clarity.",

    tone: typeof value.tone === "string" && value.tone.trim() ? value.tone : input.tone || "confident",

    ctaGoal: typeof value.ctaGoal === "string" && value.ctaGoal.trim() ? value.ctaGoal : "Invite the audience to learn more.",

    platformStrategy,

    positioningSummary: typeof value.positioningSummary === "string" && value.positioningSummary.trim() ? value.positioningSummary : input.prompt,

    alternateHooks: normalizeStringArray(value.alternateHooks),

    screenshotContext: input.screenshotContext ?? undefined,

  };

}

export async function assertManualAssetAccess(input: {

  manualAssetId: string;

  userId: string;

  shopId: string | null;

}): Promise<ManualAssetOwner> {

  const supabase = createAdminClient();

  const { data: asset, error } = await supabase

    .from("shopreel_manual_assets")

    .select("id, shop_id, created_by")

    .eq("id", input.manualAssetId)

    .maybeSingle();

  if (error) throw new Error(`Manual asset lookup failed: ${error.message}`);

  if (!asset) throw new Error("Manual asset not found");

  const canAccess =

    asset.created_by === input.userId ||

    Boolean(input.shopId && asset.shop_id === input.shopId);

  if (!canAccess) throw new Error("Manual asset not found");

  return asset;

}

export async function extractScreenshotContext(input: {

  manualAssetId: string;

  userId: string;

  shopId: string | null;

}): Promise<ScreenshotContext | null> {

  await assertManualAssetAccess(input);

  const supabase = createAdminClient();

  const { data: files, error } = await supabase

    .from("shopreel_manual_asset_files")

    .select("storage_path,mime_type,file_name")

    .eq("asset_id", input.manualAssetId)

    .order("sort_order", { ascending: true })

    .limit(6);

  if (error) throw new Error(`Manual asset files lookup failed: ${error.message}`);

  const imageFiles = ((files ?? []) as ManualAssetFile[]).filter((file) =>

    (file.mime_type ?? "").startsWith("image/"),

  );

  if (imageFiles.length === 0) return null;

  const content: Array<

    | { type: "input_text"; text: string }

    | { type: "input_image"; image_url: string; detail: "low" | "high" | "auto" }

  > = [

    {

      type: "input_text",

      text:

        "Analyze these uploaded product screenshots for a social content creation brief. Return compact JSON only. " +

        "Only describe visible or strongly implied product facts. Do not invent unsupported features.",

    },

  ];

  for (const file of imageFiles.slice(0, 3)) {

    const { data: signed, error: signedError } = await supabase.storage

      .from("shopreel-media")

      .createSignedUrl(file.storage_path, 60 * 10);

    if (signedError || !signed?.signedUrl) continue;

    content.push({ type: "input_image", image_url: signed.signedUrl, detail: "low" });

  }

  if (content.length === 1) return null;

  const response = await openai.responses.create({

    model: SHOPREEL_AI_MODELS.vision,

    input: [{ role: "user", content }],

    text: {

      format: {

        type: "json_schema",

        name: "screenshot_context",

        schema: {

          type: "object",

          additionalProperties: false,

          properties: {

            productName: { type: "string" },

            productType: { type: "string" },

            uiClues: { type: "array", items: { type: "string" } },

            userActions: { type: "array", items: { type: "string" } },

            likelyBenefit: { type: "string" },

          },

          required: ["productName", "productType", "uiClues", "userActions", "likelyBenefit"],

        },

      },

    },

  });

  return normalizeScreenshotContext(safeJsonParse<Partial<ScreenshotContext>>(response.output_text, {}));

}

export async function buildCreativeBrief(input: {

  prompt: string;

  audience?: string;

  platformIds: ShopReelPlatformId[];

  tone?: string;

  screenshotContext?: ScreenshotContext | null;

}): Promise<CreativeBrief> {

  const response = await openai.responses.create({

    model: SHOPREEL_AI_MODELS.text,

    input: [

      {

        role: "user",

        content: [

          {

            type: "input_text",

            text:

              "Return JSON only. Build a high-quality creative brief for launch-ready social content. " +

              "Do not write final captions yet. Do not repeat the prompt verbatim. " +

              "Use screenshot context as factual support only. Do not invent unsupported product features.",

          },

          { type: "input_text", text: `User prompt: ${input.prompt}` },

          { type: "input_text", text: `Audience: ${input.audience || "General target audience"}` },

          { type: "input_text", text: `Platforms: ${input.platformIds.join(", ")}` },

          { type: "input_text", text: `Tone: ${input.tone || "confident"}` },

          {

            type: "input_text",

            text: `Screenshot context: ${

              input.screenshotContext ? JSON.stringify(input.screenshotContext) : "Not available"

            }`,

          },

        ],

      },

    ],

    text: {

      format: {

        type: "json_schema",

        name: "creative_brief",

        schema: {

          type: "object",

          additionalProperties: false,

          properties: {

            productName: { type: "string" },

            audience: { type: "string" },

            primaryPainPoint: { type: "string" },

            primaryValueProp: { type: "string" },

            proofPoints: { type: "array", items: { type: "string" } },

            emotionalPromise: { type: "string" },

            tone: { type: "string" },

            ctaGoal: { type: "string" },

            platformStrategy: { type: "object", additionalProperties: { type: "string" } },

            positioningSummary: { type: "string" },

            alternateHooks: { type: "array", items: { type: "string" } },

          },

          required: [

            "productName",

            "audience",

            "primaryPainPoint",

            "primaryValueProp",

            "proofPoints",

            "emotionalPromise",

            "tone",

            "ctaGoal",

            "platformStrategy",

            "positioningSummary",

            "alternateHooks",

          ],

        },

      },

    },

  });

  return normalizeCreativeBrief(

    safeJsonParse<Partial<CreativeBrief>>(response.output_text, {}),

    {

      prompt: input.prompt,

      audience: input.audience,

      tone: input.tone,

      screenshotContext: input.screenshotContext,

    },

  );

}

