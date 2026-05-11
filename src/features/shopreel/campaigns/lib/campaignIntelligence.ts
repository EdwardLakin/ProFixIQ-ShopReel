import type { Json } from "@/types/supabase";

type DistilledPrompt = {
  summary: string;
  intent: string;
  themes: string[];
  emotionalSignals: string[];
  audienceSegments: string[];
  objections: string[];
  outcomes: string[];
  sourceKeywords: string[];
};

type CampaignBrain = {
  thesis: string;
  emotionalCore: string;
  audiencePersonas: string[];
  contentPillars: string[];
  hooks: string[];
  ctaStrategy: string[];
  platformStrategy: string[];
};

export type CampaignAngleDraft = {
  angle: string;
  title: string;
  prompt: string;
  sortOrder: number;
  hook: string;
  objection: string;
  emotionalOutcome: string;
  platformAdaptation: string;
};

const STOPWORDS = new Set(["the","and","for","with","that","this","from","into","about","your","their","have","been","will","want","need","make","more","less","just","show","than","when","they","them","you","our","out","too"]);

function uniqueList(values: string[], max = 6): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values.map((v) => v.trim()).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= max) break;
  }
  return out;
}

export function distillCampaignPrompt(input: string): DistilledPrompt {
  const normalized = input.replace(/\s+/g, " ").trim();
  const summary = normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
  const tokens = normalized.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? [];
  const keywords = uniqueList(tokens.filter((t) => t.length > 3 && !STOPWORDS.has(t)), 12);

  const audienceSegments = uniqueList([
    /(founder|ceo|owner)/i.test(normalized) ? "Owners and founders" : "Decision makers",
    /(team|staff|ops|operator)/i.test(normalized) ? "Ops and execution teams" : "Frontline practitioners",
    /(customer|buyer|audience|client)/i.test(normalized) ? "End customers" : "Prospective buyers",
  ], 3);

  const emotionalSignals = uniqueList([
    /(frustrat|chaos|stuck|slow|waste)/i.test(normalized) ? "frustration" : "urgency",
    /(risk|afraid|fear|uncertain|doubt)/i.test(normalized) ? "risk aversion" : "confidence seeking",
    /(growth|win|scale|momentum|better)/i.test(normalized) ? "momentum" : "relief",
  ], 3);

  const objections = uniqueList([
    "This sounds like another tool with setup overhead.",
    "Will this work in a real day-to-day workflow?",
    "Is the quality actually better, or just faster?",
  ]);

  const outcomes = uniqueList([
    "clearer execution with less friction",
    "higher confidence in output quality",
    "faster cycles without losing control",
  ]);

  return {
    summary,
    intent: `Turn ${keywords.slice(0, 3).join(", ") || "the core idea"} into distinct campaign narratives that drive action.`,
    themes: uniqueList([keywords.slice(0, 2).join(" + "), keywords.slice(2, 4).join(" + "), "proof before promise"].filter(Boolean)),
    emotionalSignals,
    audienceSegments,
    objections,
    outcomes,
    sourceKeywords: keywords,
  };
}

export function buildCampaignBrain(coreIdea: string): CampaignBrain {
  const distilled = distillCampaignPrompt(coreIdea);
  return {
    thesis: distilled.intent,
    emotionalCore: `${distilled.emotionalSignals[0]} transformed into ${distilled.outcomes[0]}`,
    audiencePersonas: distilled.audienceSegments,
    contentPillars: uniqueList(["Tension-to-resolution stories", "Behavior change proof", "Credibility moments", "Action-ready next steps"]),
    hooks: uniqueList([
      "If your workflow feels busy but not effective, this is why.",
      "Most teams optimize effort, not outcome—here's the switch.",
      "What changes when execution becomes predictable?",
      "The hidden cost is not speed—it's rework.",
    ], 8),
    ctaStrategy: uniqueList([
      "Invite viewers to test one behavior change today.",
      "Offer a low-friction next step (save/comment/DM).",
      "Frame CTA as confidence gain, not a sales push.",
    ]),
    platformStrategy: uniqueList([
      "TikTok/Reels: pattern interrupt in first 2s + one emotional beat.",
      "YouTube Shorts: narrative arc with payoff line in final 4s.",
      "LinkedIn: operator framing + practical takeaway in caption.",
    ]),
  };
}

export function generateDifferentiatedAngles(args: { title: string; coreIdea: string }): CampaignAngleDraft[] {
  const brain = buildCampaignBrain(args.coreIdea);
  const distilled = distillCampaignPrompt(args.coreIdea);
  const angleFrames = [
    { angle: "Emotional Tension", narrative: "Show inner friction before any feature appears", hookType: "confession" },
    { angle: "Situational Breakdown", narrative: "Drop into a specific real-world moment and escalate stakes", hookType: "scenario" },
    { angle: "Behavior Shift", narrative: "Contrast habits that stall progress vs habits that create momentum", hookType: "challenge" },
    { angle: "Cinematic Proof", narrative: "Use visual progression that proves outcome without overexplaining", hookType: "proof" },
  ] as const;

  return angleFrames.map((frame, index) => {
    const hook = brain.hooks[index % brain.hooks.length] ?? "Start with a sharp human truth.";
    const objection = distilled.objections[index % distilled.objections.length] ?? "Will this actually work?";
    const outcome = distilled.outcomes[index % distilled.outcomes.length] ?? "Confidence and momentum.";
    const platformAdaptation = brain.platformStrategy[index % brain.platformStrategy.length] ?? "Short-form first.";

    const prompt = [
      `Create a short cinematic vertical video concept for: ${args.coreIdea}.`,
      `Creative frame: ${frame.angle}. Narrative objective: ${frame.narrative}.`,
      `Audience focus: ${brain.audiencePersonas.join("; ")}.`,
      `Emotional target: ${brain.emotionalCore}.`,
      `Primary hook style: ${frame.hookType}. Opening hook line: ${hook}`,
      `Address this objection naturally: ${objection}`,
      `End-state to visualize: ${outcome}`,
      `Platform adaptation: ${platformAdaptation}`,
      "Avoid repeating the source prompt verbatim. Build a fresh, behavior-driven narrative with concrete situational details.",
    ].join(" ");

    return {
      angle: frame.angle,
      title: `${args.title} — ${frame.angle}`,
      prompt,
      sortOrder: index + 1,
      hook,
      objection,
      emotionalOutcome: outcome,
      platformAdaptation,
    };
  });
}

export function buildCampaignBrainMetadata(coreIdea: string): Json {
  const distilled = distillCampaignPrompt(coreIdea);
  const brain = buildCampaignBrain(coreIdea);
  return {
    campaign_thesis: brain.thesis,
    emotional_core: brain.emotionalCore,
    audience_personas: brain.audiencePersonas,
    content_pillars: brain.contentPillars,
    angle_hooks: brain.hooks,
    cta_strategy: brain.ctaStrategy,
    platform_strategy: brain.platformStrategy,
    distilled_prompt: distilled,
  } satisfies Json;
}
