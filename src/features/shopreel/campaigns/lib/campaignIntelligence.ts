import type { Json } from "@/types/supabase";
import type { CampaignMode, ParsedCampaignBrief } from "@/features/shopreel/campaigns/lib/campaignIntakeTypes";
import { buildHumanBehaviorLayer, buildSceneTextureSystem, buildVisualNarrativeDirection, detectRealismDegradation, nextEmotionalArcStage, scoreEmotionalRealism } from "./narrativeIntelligence";

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
  realismDegradation: ReturnType<typeof detectRealismDegradation>;
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

const MODE_ANGLE_KEYS: Record<CampaignMode, string[]> = {
  business_advertising: ["problem_solution","local_trust","founder_story","limited_offer","convenience"],
  launch_campaign: ["category_problem","founder_story","product_demo","emotional_outcome","objection_handling"],
  weekly_content: ["education","proof","behind_the_scenes","offer","community"],
  uploaded_asset: ["before_after","proof_point","story_from_asset","educational_breakdown","CTA_post"],
  campaign_refine: ["stronger_hook","clearer_offer","less_generic","emotional_reframe","direct_response"],
  publish_learning: ["best_performer_followup","repurpose","platform_version","schedule_sequence","next_campaign"],
  internal_self_marketing: ["ShopReel_as_operator","before_after_marketing","founder_building_in_public","small_business_content_engine","AI_operating_system_not_tool"],
  general_campaign: ["problem_solution","proof","emotional_outcome","product_demo","direct_response"],
};

export type ProductionPackage = { mode: CampaignMode; sections: Record<string, string | string[]> };

function buildBusinessHook(angle: string, brief: ParsedCampaignBrief | null | undefined) {
  const service = brief?.serviceCategory ?? brief?.businessType ?? "local service";
  const location = brief?.location ? ` in ${brief.location}` : "";
  if (angle === "problem_solution") return `Need ${service} ${location}? Get a fast quote without back-and-forth.`;
  if (angle === "local_trust") return `${service} trusted by neighbors${location}—quick replies and clear pricing.`;
  if (angle === "founder_story") return `I started this ${service} business to make booking simple${location}.`;
  if (angle === "limited_offer") return `${service}${location}: first-time booking offer available this week.`;
  return `Busy schedule? We bring ${service} to you${location}.`;
}

export function generateDifferentiatedAngles(args: { title: string; coreIdea: string; parsedBrief?: ParsedCampaignBrief | null }): CampaignAngleDraft[] {
  const brain = buildCampaignBrain(args.coreIdea);
  const distilled = distillCampaignPrompt(args.coreIdea);
  const mode = args.parsedBrief?.mode ?? "general_campaign";
  const angleFrames = MODE_ANGLE_KEYS[mode].map((key) => ({ angle: key, narrative: `Mode-specific narrative for ${key.replace(/_/g, " ")}`, hookType: "proof", archetype: key.replace(/_/g, " ") }));

  return angleFrames.map((frame, index) => {
    const hook = mode === "business_advertising"
      ? buildBusinessHook(frame.angle, args.parsedBrief)
      : (brain.hooks[index % brain.hooks.length] ?? "Start with a sharp human truth.");
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
      `Human behavior layer: ${buildHumanBehaviorLayer(args.coreIdea, index + 1).behaviorTypes.join("; ")}. Avoidance loops: ${buildHumanBehaviorLayer(args.coreIdea, index + 1).avoidanceLoops.join("; ")}.`,
      `Emotional contradictions: ${buildHumanBehaviorLayer(args.coreIdea, index + 1).emotionalContradictions.join("; ")}.`,
      `Scene texture system: room tone(${buildSceneTextureSystem(args.coreIdea, index + 1).roomTone}); ambient(${buildSceneTextureSystem(args.coreIdea, index + 1).ambientSound}); object detail(${buildSceneTextureSystem(args.coreIdea, index + 1).objectDetail}); lighting(${buildSceneTextureSystem(args.coreIdea, index + 1).lightingTexture}); time-of-day(${buildSceneTextureSystem(args.coreIdea, index + 1).timeOfDay} -> ${buildSceneTextureSystem(args.coreIdea, index + 1).timeOfDayEmotionalSignal}).`,
      "Realism guardrails: avoid motivational slogans, avoid over-explaining emotion, allow pauses, interruptions, contradictions, and incomplete thoughts.",
      `Narrative beats: Hook(${storyboard.hook}) Setup(${storyboard.setup}) Tension(${storyboard.tension}) Transition(${storyboard.transition}) Payoff(${storyboard.payoff}) CTA(${storyboard.cta}).`,
      `Visual storytelling direction: pacing(${storyboard.pacing}); tone(${storyboard.tone}); camera feel(${storyboard.cameraFeel}); edit rhythm(${storyboard.editRhythm}); text overlay style(${storyboard.textOverlayStyle}); transition style(${storyboard.transitionStyle}); music energy(${storyboard.musicEnergy}).`,
      `Platform-specific pacing: TikTok(${storyboard.platformAdaptation.tiktok}) Reels(${storyboard.platformAdaptation.reels}) Shorts(${storyboard.platformAdaptation.shorts}).`,
      "Avoid repeating the source prompt verbatim. Build a specific human scenario with cinematic details and emotional realism.",
    ].join(" ");

    const realism = scoreEmotionalRealism(prompt);
    const realismDegradation = detectRealismDegradation(prompt);
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
      realismDegradation,
    };
  });
}

export function buildCampaignBrainMetadata(coreIdea: string): Json {
  const distilled = distillCampaignPrompt(coreIdea);
  const brain = buildCampaignBrain(coreIdea);
  const realismBaseline = scoreEmotionalRealism(coreIdea);
  const degradationBaseline = detectRealismDegradation(coreIdea);
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
      pacing_memory: {
        emotional_intensity_history: [],
        pacing_fatigue: 0,
        tonal_repetition: 0,
        unresolved_arc_count: 0,
        escalation_curve: "awareness -> friction -> struggle -> reflection -> support -> recovery",
      },
    },
    emotional_realism_baseline: realismBaseline,
    realism_degradation_baseline: degradationBaseline,
    visual_narrative_intelligence: buildVisualNarrativeDirection(coreIdea),
  } satisfies Json;
}



export function mergeMissingAnswersIntoContext(context: Record<string, unknown>, answers: Record<string, string>) {
  const next = { ...context };
  for (const [question, answer] of Object.entries(answers)) {
    const trimmed = answer.trim();
    if (!trimmed) continue;
    const key = question.toLowerCase();
    if (key.includes("business name")) next.business_name = trimmed;
    else if (key.includes("offer")) next.intro_offer = trimmed;
    else if (key.includes("trust")) next.trust_signal = trimmed;
    else next[`answer_${key.replace(/[^a-z0-9]+/g, "_")}`] = trimmed;
  }
  return next;
}

export function buildProductionPackage(mode: CampaignMode, angleTitle: string, hook: string, cta: string): ProductionPackage {
  const base = {
    caption: `${angleTitle}: ${hook}`,
    short_script: `Hook: ${hook}\nBody: Show practical proof.\nCTA: ${cta}`,
    cta_options: [cta, "DM us to get started", "Comment READY for details"],
  };
  const sectionsByMode: Record<CampaignMode, Record<string, string | string[]>> = {
    business_advertising: {
      facebook_post: `${hook}\n\nIf you need reliable help, we can get you booked quickly with clear next steps.\n\nMessage us to book or get a quote today.`,
      comment_reply_templates: [
        "Yes—we can help with that service. Send a quick message with details and we’ll confirm availability.",
        "Great question on pricing. DM us what you need and we’ll give you a clear quote.",
        "We serve local customers and nearby areas. Message us your location and we’ll confirm coverage.",
        "You can book by message right here. Send your preferred day/time and we’ll lock it in.",
        "Yes, we can come to you for most jobs. Share your address area and service request.",
        "Awesome—send us a quick DM and we’ll get you booked.",
      ],
      short_reel_script: "Scene 1: Quick intro shot of you/the business.\nOverlay: Local service, real results.\nScene 2: Show common customer problem.\nOverlay: Need help fast?\nScene 3: Show service in action.\nOverlay: Simple booking. Clear updates.\nScene 4: Show happy outcome or clean finish.\nOverlay: Reliable and local.\nScene 5: On-camera CTA.\nOverlay: Message now to book.",
      local_ad_copy: "Headline: Local service you can book today\nPrimary text: Need help from a reliable local business? We make booking simple, respond quickly, and keep pricing clear. Message now for a quote.\nCTA: Send Message\nOffer line: Ask about our first-time customer offer.",
      cta_options: ["Message to book", "DM for a quote", "Send details to get pricing", "Message your service request", "Book your spot today"],
      follow_up_post_ideas: [
        "Post a before/after with one sentence on what was fixed and how to book.",
        "Post a quick FAQ: pricing, service area, and response times.",
        "Post a customer story/testimonial with a direct message CTA.",
      ],
      facebook_comment_reply: "Reply quickly, answer clearly, and invite a DM with booking details.",
      caption: base.caption,
      CTA_options: base.cta_options,
    },
    launch_campaign: { launch_positioning: "Why now + who this is for", announcement_post: base.caption, founder_story_post: "Founder insight + launch mission", short_form_video_concepts: ["Problem", "Demo", "Outcome"], landing_page_hero_copy: "Launch with confidence", launch_email: "Launch announcement + CTA", seven_day_launch_sequence: "Day 1 announce, Day 2 proof..." },
    weekly_content: { seven_day_content_calendar: "Mon-Sun with themes", post_ideas: ["Education", "Proof", "Offer"], captions: [base.caption], hooks: [hook], reel_scripts: [base.short_script], CTA_suggestions: base.cta_options },
    uploaded_asset: { asset_caption: base.caption, before_after_post: "Before/After story", reel_script: base.short_script, overlay_text: "Before → After", thumbnail_title: angleTitle, CTA: cta },
    campaign_refine: { diagnosis: "Current angle too generic", rewritten_hook: hook, rewritten_caption: base.caption, stronger_CTA: cta, alternate_angles: ["More direct", "More emotional"], before_after_comparison: "Old vs new messaging" },
    publish_learning: { publish_checklist: "Hook, CTA, platform fit", schedule_suggestion: "Post during peak hours", platform_specific_versions: ["Reels", "TikTok", "Shorts"], follow_up_campaign_ideas: ["Follow-up proof angle"], make_more_like_this_recommendations: ["Reuse winning hook structure"] },
    internal_self_marketing: { shopreel_positioning_post: base.caption, founder_building_in_public_post: "Build in public update", short_reel_script: base.short_script, comparison_ad: "Manual marketing vs ShopReel", CTA_options: base.cta_options, landing_page_section_copy: "Operator-grade marketing engine" },
    general_campaign: { caption: base.caption, hook_options: [hook], short_script: base.short_script, CTA_options: base.cta_options, platform_versions: ["Reels version", "TikTok version"] },
  };
  return { mode, sections: sectionsByMode[mode] };
}
