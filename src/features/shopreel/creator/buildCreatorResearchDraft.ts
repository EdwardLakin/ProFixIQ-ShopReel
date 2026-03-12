import crypto from "crypto";
import type { StoryDraft } from "@/features/shopreel/story-builder/types";

export type CreatorResearchInput = {
  shopId: string;
  sourceId: string;
  topic: string;
  audience?: string | null;
  platformFocus?: "instagram" | "tiktok" | "youtube" | "facebook" | "multi";
  tone?: "professional" | "educational" | "friendly" | "direct" | "confident" | "high-energy";
  researchSummary?: string | null;
  bullets?: string[];
  hook?: string | null;
  contextLine?: string | null;
  explanationLine?: string | null;
  takeawayLine?: string | null;
  ctaLine?: string | null;
  expandedTopic?: string | null;
  mode?: "research_script" | "angle_pack" | "debunk" | "stitch";
};

function makeId(prefix: string) {
  return `${prefix}:${crypto.randomUUID()}`;
}

function cleanTopic(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildTitle(topic: string) {
  const cleaned = cleanTopic(topic);
  return cleaned.length <= 68 ? cleaned : `${cleaned.slice(0, 65).trim()}...`;
}

function defaultHook(topic: string) {
  const cleaned = cleanTopic(topic);
  if (!cleaned) return "Here’s what you need to know.";
  return `${cleaned} — here’s what you need to know.`;
}

function buildTargetChannels(platformFocus: NonNullable<CreatorResearchInput["platformFocus"]>) {
  if (platformFocus === "instagram") return ["instagram_reel"] as const;
  if (platformFocus === "tiktok") return ["tiktok_video"] as const;
  if (platformFocus === "youtube") return ["youtube_short"] as const;
  if (platformFocus === "facebook") return ["facebook_video"] as const;
  return ["instagram_reel", "tiktok_video", "youtube_short", "facebook_video"] as const;
}

function lineOrFallback(value: string | null | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

export function buildCreatorResearchDraft(input: CreatorResearchInput): StoryDraft {
  const topic = cleanTopic(input.topic);
  const title = buildTitle(topic);
  const bullets = (input.bullets ?? []).filter(Boolean).slice(0, 6);
  const expandedTopic = input.expandedTopic?.trim() || topic;

  const hook = lineOrFallback(input.hook, defaultHook(topic));
  const contextLine = lineOrFallback(
    input.contextLine,
    bullets[0] ?? `What people are saying about ${expandedTopic}.`,
  );
  const explanationLine = lineOrFallback(
    input.explanationLine,
    bullets[1] ?? "Here is what appears credible and what still feels uncertain.",
  );
  const takeawayLine = lineOrFallback(
    input.takeawayLine,
    bullets[2] ?? "Here is why this matters for viewers right now.",
  );
  const ctaLine = lineOrFallback(
    input.ctaLine,
    "Follow for more updates, and check back for the next breakdown.",
  );

  const scenes = [
    {
      id: makeId("scene"),
      role: "hook" as const,
      title: "Hook",
      overlayText: hook,
      voiceoverText: hook,
      durationSeconds: 3,
      media: [],
      metadata: { creatorMode: true, sourceAssetCount: 0 },
    },
    {
      id: makeId("scene"),
      role: "context" as const,
      title: "Context",
      overlayText: "What’s being said",
      voiceoverText: contextLine,
      durationSeconds: 5,
      media: [],
      metadata: { creatorMode: true, sourceAssetCount: 0 },
    },
    {
      id: makeId("scene"),
      role: "explanation" as const,
      title: "What matters",
      overlayText: "What matters most",
      voiceoverText: explanationLine,
      durationSeconds: 6,
      media: [],
      metadata: { creatorMode: true, sourceAssetCount: 0 },
    },
    {
      id: makeId("scene"),
      role: "takeaway" as const,
      title: "Takeaway",
      overlayText: "Bottom line",
      voiceoverText: takeawayLine,
      durationSeconds: 4,
      media: [],
      metadata: { creatorMode: true, sourceAssetCount: 0 },
    },
    {
      id: makeId("scene"),
      role: "cta" as const,
      title: "CTA",
      overlayText: "Follow for more updates",
      voiceoverText: ctaLine,
      durationSeconds: 3,
      media: [],
      metadata: { creatorMode: true, sourceAssetCount: 0 },
    },
  ];

  const voiceoverText = scenes
    .map((scene) => scene.voiceoverText ?? "")
    .filter(Boolean)
    .join(" ");

  const scriptText = scenes
    .map((scene) => `${scene.title.toUpperCase()}\n${scene.voiceoverText ?? ""}`)
    .join("\n\n");

  const audience = input.audience?.trim() ?? "";

  return {
    id: makeId("draft"),
    shopId: input.shopId,
    sourceId: input.sourceId,
    sourceKind: "creator_idea",
    title,
    hook,
    caption: audience ? `${topic}\n\nMade for: ${audience}` : topic,
    cta: ctaLine,
    hashtags: [],
    tone: input.tone ?? "confident",
    targetChannels: [...buildTargetChannels(input.platformFocus ?? "multi")],
    targetDurationSeconds: 21,
    summary: input.researchSummary?.trim() || expandedTopic,
    voiceoverText,
    scriptText,
    scenes,
    metadata: {
      creatorMode: true,
      creatorModeType: input.mode ?? "research_script",
      audience: audience || null,
      platformFocus: input.platformFocus ?? "multi",
      expandedTopic,
      researchSummary: input.researchSummary ?? null,
      bullets,
      sourceOrigin: "creator_mode",
      script: {
        hook,
        context: contextLine,
        explanation: explanationLine,
        takeaway: takeawayLine,
        cta: ctaLine,
      },
    },
  };
}
