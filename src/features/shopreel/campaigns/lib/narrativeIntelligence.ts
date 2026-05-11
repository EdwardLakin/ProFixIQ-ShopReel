export type EmotionalArcStage =
  | "awareness"
  | "friction"
  | "struggle"
  | "reflection"
  | "understanding"
  | "support"
  | "recovery"
  | "momentum"
  | "confidence"
  | "calm_maintenance";

export type HumanMomentBlueprint = {
  momentType: string;
  emotionalTrigger: string;
  physicalBehavior: string;
  environmentDetail: string;
  sensoryCue: string;
  interruption: string;
  hesitation: string;
  internalMonologue?: string;
  pacing: string;
  dialogueStyle: string;
};

export type VisualNarrativeDirection = {
  framing: string;
  lensStyle: string;
  cameraDistance: string;
  cameraMovement: string;
  lightingMood: string;
  textureRealism: string;
  motionPacing: string;
  editRhythm: string;
  transitionEnergy: string;
  environmentComposition: string;
  platformPacing: Record<"tiktok" | "reels" | "shorts", string>;
};

export type EmotionalRealismScore = {
  realismScore: number;
  emotionalSpecificityScore: number;
  vulnerabilityScore: number;
  pacingAuthenticityScore: number;
  sceneUniquenessScore: number;
  dialogueRealismScore: number;
  penalties: string[];
  summary: string;
};

export type HumanBehaviorLayerResult = {
  behaviorTypes: string[];
  avoidanceLoops: string[];
  emotionalContradictions: string[];
  dialogueImperfections: string[];
  pacingImperfections: string[];
};

export type SceneTextureResult = {
  roomTone: string;
  ambientSound: string;
  objectDetail: string;
  lightingTexture: string;
  movementRhythm: string;
  environmentalClutter: string;
  physicalAtmosphere: string;
  silencePacing: string;
  backgroundActivity: string;
  timeOfDay: "morning" | "afternoon" | "late_night";
  timeOfDayEmotionalSignal: string;
};

export type RealismDegradationScore = {
  realismDegradationScore: number;
  aiLanguageProbability: number;
  emotionalAuthenticityScore: number;
  pacingRealismScore: number;
  dialogueRealismScore: number;
  behavioralRealismScore: number;
  penalties: string[];
};

const MOMENT_LIBRARY: ReadonlyArray<HumanMomentBlueprint> = [
  {
    momentType: "staring_at_unread_messages",
    emotionalTrigger: "notification anxiety and social avoidance",
    physicalBehavior: "opens the same message thread repeatedly without replying",
    environmentDetail: "dim monitor glow, backpack dropped on the floor, untouched coffee beside keyboard",
    sensoryCue: "soft phone vibration, shallow breathing, finger tapping on desk edge",
    interruption: "new notification arrives mid-hesitation",
    hesitation: "cursor hovers over send, then moves away",
    internalMonologue: "I'll do it in a minute.",
    pacing: "slow stillness -> micro-spikes of tension -> prolonged pause",
    dialogueStyle: "fragmented half-sentences and unfinished thoughts",
  },
  {
    momentType: "late_night_study_shutdown",
    emotionalTrigger: "mental fatigue and fear of falling behind",
    physicalBehavior: "closes and reopens laptop three times, rereads one line repeatedly",
    environmentDetail: "quiet apartment hum, desk lamp only, notebook open to incomplete to-do list",
    sensoryCue: "clock ticking, dry eyes, shoulders tightening",
    interruption: "calendar reminder pops up while focus drops",
    hesitation: "hand reaches for keyboard then freezes",
    internalMonologue: "Why can't I just start?",
    pacing: "dragging intro -> jittery middle -> stalled silence",
    dialogueStyle: "minimal speech, mostly self-directed fragments",
  },
  {
    momentType: "small_recovery_win",
    emotionalTrigger: "exhaustion slowly turning into grounded momentum",
    physicalBehavior: "takes one small actionable step and visibly exhales",
    environmentDetail: "morning window light, slightly messy desk, checklist with one fresh checkmark",
    sensoryCue: "chair creak, steady breath, ambient room tone",
    interruption: "incoming ping ignored to protect regained focus",
    hesitation: "brief pause before recommitting",
    internalMonologue: "Okay, one step.",
    pacing: "hesitant open -> deliberate action -> quiet stabilizing close",
    dialogueStyle: "brief practical language, no motivational slogans",
  },
];

const BANNED_PATTERNS = [
  "unlock your full potential",
  "transform your life today",
  "future of productivity",
  "never feel overwhelmed again",
  "life-changing ai",
];

const AI_LANGUAGE_FLAGS = [
  "you are stronger than you think",
  "everything changed when",
  "future of emotional support",
  "never struggle again",
  "life-changing ai",
  "unlock your",
  "transform your life",
  "the future of",
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function selectHumanMoment(seed: string, sceneOrder: number): HumanMomentBlueprint {
  const index = Math.abs((seed + sceneOrder).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % MOMENT_LIBRARY.length;
  return MOMENT_LIBRARY[index] ?? MOMENT_LIBRARY[0];
}

export function buildVisualNarrativeDirection(platformHint: string | null | undefined): VisualNarrativeDirection {
  const platform = (platformHint ?? "").toLowerCase();
  return {
    framing: "observational framing with lived-in negative space",
    lensStyle: "soft-focus realism with subtle grain",
    cameraDistance: "alternating intimate close-up and medium environmental coverage",
    cameraMovement: "handheld micro-drift with purposeful still pauses",
    lightingMood: "natural practical lighting, low-contrast highlight rolloff",
    textureRealism: "retain skin texture, desk clutter, and imperfect surfaces",
    motionPacing: "allow silence and pauses before each transition",
    editRhythm: "interrupt-driven cuts early, calmer lingering beats in recovery",
    transitionEnergy: "movement-led or breath-led transitions, avoid template wipes",
    environmentComposition: "grounded room details that show daily life and unfinished context",
    platformPacing: {
      tiktok: "faster interruption pacing, stronger early visual disruption, dynamic handheld moves",
      reels: "warmer polish, smoother visual flow, emotionally coherent close-ups",
      shorts: "clear narrative progression with explicit cause/effect visual sequence",
    },
  };
}

export function scoreEmotionalRealism(text: string): EmotionalRealismScore {
  const normalized = text.toLowerCase();
  const specificitySignals = ["opened", "re-reading", "cursor", "untouched coffee", "monitor glow", "shallow breathing", "silence"];
  const vulnerabilitySignals = ["behind", "can't", "hesitation", "stalled", "avoiding", "overwhelmed"];
  const dialogueSignals = ["i'll", "why can't", "maybe tomorrow", "one step"];

  const penalties = BANNED_PATTERNS.filter((p) => normalized.includes(p));
  const specificity = specificitySignals.filter((s) => normalized.includes(s)).length * 14;
  const vulnerability = vulnerabilitySignals.filter((s) => normalized.includes(s)).length * 16;
  const dialogue = dialogueSignals.filter((s) => normalized.includes(s)).length * 25;
  const pacing = normalized.includes("->") || normalized.includes("pause") ? 78 : 52;
  const uniqueness = normalized.includes("scene objective") ? 72 : 58;
  const penaltyValue = penalties.length * 18;

  const realism = clampScore((specificity + vulnerability + dialogue + pacing + uniqueness) / 5 - penaltyValue);

  return {
    realismScore: realism,
    emotionalSpecificityScore: clampScore(specificity - penaltyValue),
    vulnerabilityScore: clampScore(vulnerability - penaltyValue),
    pacingAuthenticityScore: clampScore(pacing - penaltyValue),
    sceneUniquenessScore: clampScore(uniqueness - penaltyValue / 2),
    dialogueRealismScore: clampScore(dialogue - penaltyValue),
    penalties,
    summary: penalties.length > 0 ? "Downgraded for generic motivational language." : "Emotionally grounded with specific human behavior cues.",
  };
}

export function buildHumanBehaviorLayer(seed: string, sceneOrder: number): HumanBehaviorLayerResult {
  const m = selectHumanMoment(seed, sceneOrder);
  const behaviorPool = [
    m.physicalBehavior,
    "checks phone repeatedly while avoiding the core task",
    "starts typing then deletes the full line",
    "opens and closes tabs without committing",
    "stops mid-thought and stares before continuing",
  ];
  const avoidance = [
    "opens the assignment, then drifts into distraction before returning",
    "refreshes inbox while pretending to progress",
    "reorganizes nearby objects instead of beginning",
    "almost starts, then postpones for one more minute",
  ];
  const contradictions = [
    "wants help but avoids asking",
    "needs rest while feeling guilty for slowing down",
    "tries to focus while emotionally exhausted",
    "wants connection but isolates in silence",
  ];
  return {
    behaviorTypes: [behaviorPool[sceneOrder % behaviorPool.length]!, m.hesitation],
    avoidanceLoops: [avoidance[sceneOrder % avoidance.length]!, m.interruption],
    emotionalContradictions: [contradictions[sceneOrder % contradictions.length]!, m.emotionalTrigger],
    dialogueImperfections: ["short unfinished phrases", "self-corrections", "awkward pauses"],
    pacingImperfections: ["delayed response beat", "micro-hesitation before action", m.pacing],
  };
}

export function buildSceneTextureSystem(seed: string, sceneOrder: number): SceneTextureResult {
  const slot = sceneOrder % 3;
  const timeOfDay: SceneTextureResult["timeOfDay"] = slot === 1 ? "morning" : slot === 2 ? "afternoon" : "late_night";
  const emotional = timeOfDay === "morning" ? "anxiety starting with rushed pressure" : timeOfDay === "afternoon" ? "burnout and energy crash" : "isolation, exhaustion, quiet vulnerability";
  const textures = selectHumanMoment(seed, sceneOrder);
  return {
    roomTone: "lived-in and imperfect, not staged",
    ambientSound: textures.sensoryCue,
    objectDetail: textures.environmentDetail,
    lightingTexture: timeOfDay === "late_night" ? "cold monitor glow with low practical light" : "natural mixed practical lighting with uneven shadows",
    movementRhythm: textures.pacing,
    environmentalClutter: "unfinished tasks and partially used objects remain visible",
    physicalAtmosphere: "subtle tension in posture and breathing",
    silencePacing: "allow small silence pockets before reactions",
    backgroundActivity: "distant room or hallway activity without stealing focus",
    timeOfDay,
    timeOfDayEmotionalSignal: emotional,
  };
}

export function detectRealismDegradation(text: string): RealismDegradationScore {
  const normalized = text.toLowerCase();
  const aiFlags = AI_LANGUAGE_FLAGS.filter((f) => normalized.includes(f));
  const overCleanFlags = ["perfect", "always", "never", "everything changed"].filter((f) => normalized.includes(f));
  const noHesitationPenalty = /(pause|hesitat|interrupt|unfinished|silence)/i.test(text) ? 0 : 20;
  const aiProbability = clampScore(aiFlags.length * 20 + overCleanFlags.length * 12 + noHesitationPenalty);
  const degradation = clampScore(aiProbability + (text.length < 160 ? 14 : 0));
  return {
    realismDegradationScore: degradation,
    aiLanguageProbability: aiProbability,
    emotionalAuthenticityScore: clampScore(100 - degradation),
    pacingRealismScore: clampScore(84 - noHesitationPenalty - aiFlags.length * 8),
    dialogueRealismScore: clampScore(80 - aiFlags.length * 10 - overCleanFlags.length * 8),
    behavioralRealismScore: clampScore(/(check|avoid|hesitat|fidget|pause|stare|re-read)/i.test(text) ? 82 : 56),
    penalties: [...aiFlags, ...overCleanFlags],
  };
}

export function nextEmotionalArcStage(previousStage?: string | null): EmotionalArcStage {
  const stages: EmotionalArcStage[] = ["awareness", "friction", "struggle", "reflection", "understanding", "support", "recovery", "momentum", "confidence", "calm_maintenance"];
  const idx = previousStage ? stages.indexOf(previousStage as EmotionalArcStage) : -1;
  return stages[Math.min(stages.length - 1, Math.max(0, idx + 1))] ?? "awareness";
}
