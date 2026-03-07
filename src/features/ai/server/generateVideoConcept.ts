import OpenAI from "openai";

export type WorkOrderInput = {
  id: string;
  customId?: string | null;
  shopId: string;
  customerName?: string | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    vin?: string | null;
  } | null;
  concern?: string | null;
  findings?: string[];
  recommendedWork?: string[];
  completedWork?: string[];
};

export type TemplateRecord = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  default_hook: string | null;
  default_cta: string | null;
  script_guidance: string | null;
  visual_guidance: string | null;
};

export type TopPerformingType = {
  content_type: string;
  avg_engagement_score: number | null;
  total_views: number | null;
  total_leads: number | null;
};

export type PlatformTarget =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube";

export type GeneratedVideoConcept = {
  title: string;
  contentType:
    | "workflow_demo"
    | "repair_story"
    | "inspection_highlight"
    | "before_after"
    | "educational_tip"
    | "how_to"
    | "findings_on_vehicle";
  hook: string;
  caption: string;
  cta: string;
  scriptText: string;
  voiceoverText: string;
  shotList: string[];
  platformTargets: PlatformTarget[];
  generationNotes: string;
  aiScore: number;
  engagementPrediction: {
    overall: number;
    hookStrength: number;
    clarity: number;
    trust: number;
    platformFit: number;
    localIntent: number;
  };
  captionByPlatform: Record<PlatformTarget, string>;
  hashtagsByPlatform: Record<PlatformTarget, string[]>;
};

type RawConceptResponse = {
  title?: unknown;
  contentType?: unknown;
  hook?: unknown;
  caption?: unknown;
  cta?: unknown;
  scriptText?: unknown;
  voiceoverText?: unknown;
  shotList?: unknown;
  platformTargets?: unknown;
  generationNotes?: unknown;
  aiScore?: unknown;
  engagementPrediction?: unknown;
  captionByPlatform?: unknown;
  hashtagsByPlatform?: unknown;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_CONTENT_TYPES = new Set<GeneratedVideoConcept["contentType"]>([
  "workflow_demo",
  "repair_story",
  "inspection_highlight",
  "before_after",
  "educational_tip",
  "how_to",
  "findings_on_vehicle",
]);

const ALLOWED_PLATFORMS: PlatformTarget[] = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
];

function clampScore(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return Math.round(value * 100) / 100;
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function normalizeStringArray(
  value: unknown,
  fallback: string[],
  maxItems = 8,
): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, maxItems);

  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizePlatformTargets(value: unknown): PlatformTarget[] {
  if (!Array.isArray(value)) {
    return ["instagram", "facebook", "tiktok", "youtube"];
  }

  const cleaned = value.filter(
    (item): item is PlatformTarget =>
      typeof item === "string" &&
      ALLOWED_PLATFORMS.includes(item as PlatformTarget),
  );

  return cleaned.length > 0
    ? Array.from(new Set(cleaned))
    : ["instagram", "facebook", "tiktok", "youtube"];
}

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function buildVehicleLabel(workOrder: WorkOrderInput): string {
  const parts = [
    workOrder.vehicle?.year?.toString(),
    workOrder.vehicle?.make ?? null,
    workOrder.vehicle?.model ?? null,
  ].filter((part): part is string => Boolean(part));

  return parts.join(" ").trim() || "Unknown vehicle";
}

function buildWorkOrderSummary(input: WorkOrderInput): string {
  return [
    `Work order ID: ${input.customId ?? input.id}`,
    `Vehicle: ${buildVehicleLabel(input)}`,
    `Customer: ${input.customerName ?? "Unknown customer"}`,
    `Concern: ${input.concern ?? "No concern provided"}`,
    `Findings: ${(input.findings ?? []).join("; ") || "None"}`,
    `Recommended work: ${(input.recommendedWork ?? []).join("; ") || "None"}`,
    `Completed work: ${(input.completedWork ?? []).join("; ") || "None"}`,
  ].join("\n");
}

function summarizeLearningSignals(topPerformingTypes: TopPerformingType[]): {
  summaryText: string;
  bestContentTypes: string[];
} {
  if (topPerformingTypes.length === 0) {
    return {
      summaryText:
        "No prior performance data exists yet. Favor clarity, trust, and strong local-shop utility.",
      bestContentTypes: [],
    };
  }

  const summaryText = topPerformingTypes
    .map((row, index) => {
      return `${index + 1}. ${row.content_type} | avg_engagement_score=${row.avg_engagement_score ?? 0} | total_views=${row.total_views ?? 0} | total_leads=${row.total_leads ?? 0}`;
    })
    .join("\n");

  return {
    summaryText,
    bestContentTypes: topPerformingTypes.map((row) => row.content_type),
  };
}

function buildFallbackConcept(args: {
  workOrder: WorkOrderInput;
  template: TemplateRecord;
  topPerformingTypes: TopPerformingType[];
}): GeneratedVideoConcept {
  const { workOrder, template, topPerformingTypes } = args;
  const vehicleLabel = buildVehicleLabel(workOrder);
  const firstFinding = workOrder.findings?.[0] ?? null;
  const firstCompleted = workOrder.completedWork?.[0] ?? null;
  const contentType = ALLOWED_CONTENT_TYPES.has(
    template.key as GeneratedVideoConcept["contentType"],
  )
    ? (template.key as GeneratedVideoConcept["contentType"])
    : "workflow_demo";

  const title =
    firstCompleted != null
      ? `${vehicleLabel}: Repair Story`
      : firstFinding != null
        ? `${vehicleLabel}: Inspection Highlight`
        : `${vehicleLabel}: Shop Workflow Demo`;

  const hook =
    template.default_hook ??
    (firstFinding != null
      ? `Here is what we found on this ${vehicleLabel} and why it mattered.`
      : `See how this ${vehicleLabel} moved through the shop without the usual chaos.`);

  const cta =
    template.default_cta ?? "Follow for more real repair and inspection content.";

  const scriptText = [
    hook,
    workOrder.concern
      ? `The vehicle came in with this concern: ${workOrder.concern}.`
      : `The vehicle came in for service and inspection.`,
    firstFinding
      ? `During the inspection, we found: ${firstFinding}.`
      : firstCompleted
        ? `The team completed: ${firstCompleted}.`
        : `We documented the process clearly from intake to completion.`,
    `The goal is always the same: clear findings, honest recommendations, and professional work.`,
    cta,
  ].join(" ");

  const voiceoverText = scriptText;

  const shotList = [
    "Opening shot of vehicle in bay",
    "Close-up of technician inspection or repair area",
    "On-screen overlay showing key finding or completed work",
    "Short clip of shop process or workflow step",
    "Final repaired / completed vehicle shot",
  ];

  const bestContentHint =
    topPerformingTypes[0]?.content_type != null
      ? `Top current performer in this shop is ${topPerformingTypes[0].content_type}.`
      : "No learning signals available yet.";

  const baseCaption = `${hook} ${workOrder.concern ? `Concern: ${workOrder.concern}. ` : ""}${firstFinding ? `Finding: ${firstFinding}. ` : ""}${firstCompleted ? `Completed: ${firstCompleted}. ` : ""}${cta}`;

  return {
    title,
    contentType,
    hook,
    caption: baseCaption,
    cta,
    scriptText,
    voiceoverText,
    shotList,
    platformTargets: ["instagram", "facebook", "tiktok", "youtube"],
    generationNotes: `Fallback concept used. ${bestContentHint} Template: ${template.name}.`,
    aiScore: 72,
    engagementPrediction: {
      overall: 72,
      hookStrength: 70,
      clarity: 80,
      trust: 82,
      platformFit: 68,
      localIntent: 74,
    },
    captionByPlatform: {
      instagram: `${baseCaption} #autorepair #carcare #shoplife`,
      facebook: `${baseCaption} We like showing real findings, real repairs, and clear process.`,
      tiktok: `${hook} Real shop, real findings, real fix. ${cta}`,
      youtube: `${hook} In this short, we show the finding, the recommendation, and the result.`,
    },
    hashtagsByPlatform: {
      instagram: ["#autorepair", "#carcare", "#mechanic", "#shoplife"],
      facebook: ["#autorepair", "#carcare", "#localshop"],
      tiktok: ["#mechanicsoftiktok", "#autorepair", "#carproblems", "#shoplife"],
      youtube: ["#autorepair", "#carcare", "#shorts"],
    },
  };
}

function normalizeEngagementPrediction(value: unknown): GeneratedVideoConcept["engagementPrediction"] {
  const fallback = {
    overall: 70,
    hookStrength: 70,
    clarity: 70,
    trust: 70,
    platformFit: 70,
    localIntent: 70,
  };

  if (typeof value !== "object" || value === null) {
    return fallback;
  }

  const prediction = value as Record<string, unknown>;

  return {
    overall: clampScore(normalizeNumber(prediction.overall, fallback.overall)),
    hookStrength: clampScore(
      normalizeNumber(prediction.hookStrength, fallback.hookStrength),
    ),
    clarity: clampScore(normalizeNumber(prediction.clarity, fallback.clarity)),
    trust: clampScore(normalizeNumber(prediction.trust, fallback.trust)),
    platformFit: clampScore(
      normalizeNumber(prediction.platformFit, fallback.platformFit),
    ),
    localIntent: clampScore(
      normalizeNumber(prediction.localIntent, fallback.localIntent),
    ),
  };
}

function normalizeCaptionByPlatform(
  value: unknown,
  fallbackCaption: string,
): Record<PlatformTarget, string> {
  const base: Record<PlatformTarget, string> = {
    instagram: fallbackCaption,
    facebook: fallbackCaption,
    tiktok: fallbackCaption,
    youtube: fallbackCaption,
  };

  if (typeof value !== "object" || value === null) {
    return base;
  }

  const record = value as Record<string, unknown>;

  return {
    instagram: normalizeString(record.instagram, base.instagram),
    facebook: normalizeString(record.facebook, base.facebook),
    tiktok: normalizeString(record.tiktok, base.tiktok),
    youtube: normalizeString(record.youtube, base.youtube),
  };
}

function normalizeHashtagsByPlatform(
  value: unknown,
): Record<PlatformTarget, string[]> {
  const base: Record<PlatformTarget, string[]> = {
    instagram: ["#autorepair", "#carcare", "#shoplife"],
    facebook: ["#autorepair", "#carcare"],
    tiktok: ["#autorepair", "#mechanicsoftiktok", "#shoplife"],
    youtube: ["#autorepair", "#shorts"],
  };

  if (typeof value !== "object" || value === null) {
    return base;
  }

  const record = value as Record<string, unknown>;

  return {
    instagram: normalizeStringArray(record.instagram, base.instagram, 8),
    facebook: normalizeStringArray(record.facebook, base.facebook, 8),
    tiktok: normalizeStringArray(record.tiktok, base.tiktok, 8),
    youtube: normalizeStringArray(record.youtube, base.youtube, 8),
  };
}

function normalizeConcept(
  raw: RawConceptResponse,
  fallback: GeneratedVideoConcept,
): GeneratedVideoConcept {
  const contentTypeCandidate = normalizeString(
    raw.contentType,
    fallback.contentType,
  );

  const contentType = ALLOWED_CONTENT_TYPES.has(
    contentTypeCandidate as GeneratedVideoConcept["contentType"],
  )
    ? (contentTypeCandidate as GeneratedVideoConcept["contentType"])
    : fallback.contentType;

  const caption = normalizeString(raw.caption, fallback.caption);

  return {
    title: normalizeString(raw.title, fallback.title),
    contentType,
    hook: normalizeString(raw.hook, fallback.hook),
    caption,
    cta: normalizeString(raw.cta, fallback.cta),
    scriptText: normalizeString(raw.scriptText, fallback.scriptText),
    voiceoverText: normalizeString(raw.voiceoverText, fallback.voiceoverText),
    shotList: normalizeStringArray(raw.shotList, fallback.shotList, 8),
    platformTargets: normalizePlatformTargets(raw.platformTargets),
    generationNotes: normalizeString(
      raw.generationNotes,
      fallback.generationNotes,
    ),
    aiScore: clampScore(normalizeNumber(raw.aiScore, fallback.aiScore)),
    engagementPrediction: normalizeEngagementPrediction(
      raw.engagementPrediction,
    ),
    captionByPlatform: normalizeCaptionByPlatform(
      raw.captionByPlatform,
      caption,
    ),
    hashtagsByPlatform: normalizeHashtagsByPlatform(raw.hashtagsByPlatform),
  };
}

export async function generateVideoConcept(args: {
  workOrder: WorkOrderInput;
  template: TemplateRecord;
  topPerformingTypes?: TopPerformingType[];
}): Promise<GeneratedVideoConcept> {
  const { workOrder, template, topPerformingTypes = [] } = args;

  const fallback = buildFallbackConcept({
    workOrder,
    template,
    topPerformingTypes,
  });

  const { summaryText, bestContentTypes } =
    summarizeLearningSignals(topPerformingTypes);

  const systemPrompt = `
You are an expert short-form video strategist for automotive repair shops, truck shops, and inspection-heavy service businesses.

Your job:
- turn real repair and inspection activity into trustworthy short-form video concepts
- optimize for local attention, clarity, credibility, and customer action
- avoid hype, fake urgency, fluff, and cheesy marketing language
- keep every concept grounded in real shop operations

You must produce content that feels:
- honest
- practical
- clear
- locally relevant
- visually shootable in a real repair shop

Priorities:
1. strong opening hook
2. clear story
3. customer understanding
4. strong trust signal
5. likely engagement
6. likely lead or booking intent

When performance signals are provided, bias toward styles that have historically worked for that shop.
`;

  const userPrompt = `
Create one high-performing short-form marketing video concept.

Selected template:
- key: ${template.key}
- name: ${template.name}
- description: ${template.description ?? ""}
- default_hook: ${template.default_hook ?? ""}
- default_cta: ${template.default_cta ?? ""}
- script_guidance: ${template.script_guidance ?? ""}
- visual_guidance: ${template.visual_guidance ?? ""}

Work order summary:
${buildWorkOrderSummary(workOrder)}

Learning signals:
${summaryText}

Best known content types for this shop:
${bestContentTypes.join(", ") || "none yet"}

Rules:
- Stay aligned with the selected template unless the work order strongly suggests a better fit.
- Keep the language professional and real.
- Make the hook short and strong.
- The script should be easy to shoot in a working repair shop.
- Include multi-platform captions tailored to Instagram, Facebook, TikTok, and YouTube Shorts.
- Hashtags should be relevant, not spammy.
- Engagement prediction scores must be 0 to 100.

Return strict JSON only with this exact shape:
{
  "title": "string",
  "contentType": "workflow_demo | repair_story | inspection_highlight | before_after | educational_tip | how_to | findings_on_vehicle",
  "hook": "string",
  "caption": "string",
  "cta": "string",
  "scriptText": "string",
  "voiceoverText": "string",
  "shotList": ["string"],
  "platformTargets": ["instagram", "facebook", "tiktok", "youtube"],
  "generationNotes": "string",
  "aiScore": 0,
  "engagementPrediction": {
    "overall": 0,
    "hookStrength": 0,
    "clarity": 0,
    "trust": 0,
    "platformFit": 0,
    "localIntent": 0
  },
  "captionByPlatform": {
    "instagram": "string",
    "facebook": "string",
    "tiktok": "string",
    "youtube": "string"
  },
  "hashtagsByPlatform": {
    "instagram": ["string"],
    "facebook": ["string"],
    "tiktok": ["string"],
    "youtube": ["string"]
  }
}
`;

  try {
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      temperature: 0.7,
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const outputText = response.output_text;
    const parsed = JSON.parse(outputText) as RawConceptResponse;

    return normalizeConcept(parsed, fallback);
  } catch {
    return fallback;
  }
}