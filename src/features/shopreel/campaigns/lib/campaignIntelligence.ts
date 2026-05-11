import type { Json } from "@/types/supabase";
import { buildVisualNarrativeDirection, nextEmotionalArcStage, scoreEmotionalRealism } from "./narrativeIntelligence";

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
  narrativeArchetype: string;
  emotionalRealism: ReturnType<typeof scoreEmotionalRealism>;
  storyboard: {
    hook: string;
    setup: string;
    tension: string;
    transition: string;
    payoff: string;
    cta: string;
    pacing: string;
    tone: string;
    cameraFeel: string;
    editRhythm: string;
    textOverlayStyle: string;
    transitionStyle: string;
    musicEnergy: string;
    platformAdaptation: Record<"tiktok" | "reels" | "shorts", string>;
  };
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
    { angle: "POV Shift", narrative: "Open in first-person urgency and move toward control", hookType: "confession", archetype: "POV" },
    { angle: "Founder Confession", narrative: "Show the operator/founder pressure before the turning point", hookType: "scenario", archetype: "founder story" },
    { angle: "Documentary Proof", narrative: "Ground the story in realistic process moments and observable change", hookType: "proof", archetype: "documentary" },
    { angle: "Before/After Release", narrative: "Contrast messy reality with emotionally clear after-state", hookType: "challenge", archetype: "before/after" },
  ] as const;

  return angleFrames.map((frame, index) => {
    const hook = brain.hooks[index % brain.hooks.length] ?? "Start with a sharp human truth.";
    const objection = distilled.objections[index % distilled.objections.length] ?? "Will this actually work?";
    const outcome = distilled.outcomes[index % distilled.outcomes.length] ?? "Confidence and momentum.";
    const platformAdaptation = brain.platformStrategy[index % brain.platformStrategy.length] ?? "Short-form first.";

    const visualDirection = buildVisualNarrativeDirection(args.coreIdea);
    const storyboard = {
      hook: `Open on a human, believable moment of ${distilled.emotionalSignals[0]} in less than 2 seconds before any product explanation.`,
      setup: "Ground the viewer in a concrete environment and role, not abstract marketing language.",
      tension: `Escalate the cost of the current behavior by showing one missed moment, one hesitation, or one visible friction loop around: ${objection}`,
      transition: "Use a decisive visual pivot (gesture, glance, workflow change, or environmental shift) instead of a lecture.",
      payoff: `Show emotional and practical release: ${outcome}. Capture body language and pacing change, not only feature output.`,
      cta: "Close with a calm, specific next action that feels useful today (save, send, try one step now).",
      pacing: "fast hook -> grounded setup -> rising pressure -> sharp pivot -> emotionally warm payoff -> concise CTA",
      tone: "human, cinematic, realistic, emotionally precise",
      cameraFeel: visualDirection.cameraMovement,
      editRhythm: visualDirection.editRhythm,
      textOverlayStyle: "minimal lower-third captions with short kinetic emphasis words only",
      transitionStyle: visualDirection.transitionEnergy,
      musicEnergy: "starts tense/minimal, lifts at pivot, resolves with warm momentum",
      platformAdaptation: visualDirection.platformPacing,
    };

    const emotionalArcStage = nextEmotionalArcStage();
    const prompt = [
      `Create a short cinematic vertical video concept for: ${args.coreIdea}.`,
      `Creative frame: ${frame.angle}. Narrative objective: ${frame.narrative}. Archetype: ${frame.archetype}.`,
      `Audience focus: ${brain.audiencePersonas.join("; ")}.`,
      `Emotional target: ${brain.emotionalCore}.`,
      `Primary hook style: ${frame.hookType}. Opening hook line: ${hook}`,
      `Address this objection naturally: ${objection}`,
      `End-state to visualize: ${outcome}`,
      `Platform adaptation: ${platformAdaptation}`,
      `Emotional arc stage: ${emotionalArcStage}. Prioritize believable vulnerability and lived-in micro-behaviors over polished claims.`,
      `Narrative beats: Hook(${storyboard.hook}) Setup(${storyboard.setup}) Tension(${storyboard.tension}) Transition(${storyboard.transition}) Payoff(${storyboard.payoff}) CTA(${storyboard.cta}).`,
      `Visual storytelling direction: pacing(${storyboard.pacing}); tone(${storyboard.tone}); camera feel(${storyboard.cameraFeel}); edit rhythm(${storyboard.editRhythm}); text overlay style(${storyboard.textOverlayStyle}); transition style(${storyboard.transitionStyle}); music energy(${storyboard.musicEnergy}).`,
      `Platform-specific pacing: TikTok(${storyboard.platformAdaptation.tiktok}) Reels(${storyboard.platformAdaptation.reels}) Shorts(${storyboard.platformAdaptation.shorts}).`,
      "Avoid repeating the source prompt verbatim. Build a specific human scenario with cinematic details and emotional realism.",
    ].join(" ");

    const realism = scoreEmotionalRealism(prompt);
    return {
      angle: frame.angle,
      title: `${args.title} — ${frame.angle}`,
      prompt,
      sortOrder: index + 1,
      hook,
      objection,
      emotionalOutcome: outcome,
      platformAdaptation,
      narrativeArchetype: frame.archetype,
      storyboard,
      // carried inside metadata for downstream review/readiness
      emotionalRealism: realism,
    };
  });
}

export function buildCampaignBrainMetadata(coreIdea: string): Json {
  const distilled = distillCampaignPrompt(coreIdea);
  const brain = buildCampaignBrain(coreIdea);
  const realismBaseline = scoreEmotionalRealism(coreIdea);
  return {
    campaign_thesis: brain.thesis,
    emotional_core: brain.emotionalCore,
    audience_personas: brain.audiencePersonas,
    content_pillars: brain.contentPillars,
    angle_hooks: brain.hooks,
    cta_strategy: brain.ctaStrategy,
    platform_strategy: brain.platformStrategy,
    distilled_prompt: distilled,
    narrative_continuity_memory: {
      current_stage: nextEmotionalArcStage(),
      progression_history: [nextEmotionalArcStage()],
      unresolved_arcs: [],
      emotional_fatigue_index: 0,
    },
    emotional_realism_baseline: realismBaseline,
    visual_narrative_intelligence: buildVisualNarrativeDirection(coreIdea),
  } satisfies Json;
}
