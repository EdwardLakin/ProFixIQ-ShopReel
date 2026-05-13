import type { RuntimeEntityGraph } from "@/features/shopreel/ui/system/runtimeEntityGraph";
import type { RuntimeTemporalMemory } from "@/features/shopreel/ui/system/runtimeTemporalMemory";
import type { RuntimeWorldOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";

export type RuntimeImmersionPhase = "arriving" | "stabilizing" | "focusing" | "immersed" | "recovering" | "returning";
export type RuntimeAttentionFocus = "primary" | "secondary" | "continuity" | "operator" | "workflow";
export type RuntimeOperationalIntensity = "low" | "moderate" | "high" | "critical";
export type RuntimePressureVisualTone = "soft" | "balanced" | "tense" | "acute";

export type RuntimeFocusCue = {
  stablePointEmphasis: number;
  resumeInterruptedFlowCue: number;
  dormantReturnPulse: number;
  blockerProximityEmphasis: number;
  dependencyVisibility: number;
  recoveryPathwayVisibility: number;
};

export type RuntimeRevealSequence = {
  primaryReveal: number;
  secondaryReveal: number[];
  continuityReveal: number;
  lineageReveal: number;
  workflowReveal: number;
};

export type RuntimeAtmosphereState = {
  inheritedSeed: string;
  ambientGlow: number;
  panelContrast: number;
  focusDepth: number;
  continuityGlow: number;
  spacingDensity: number;
  visualTone: RuntimePressureVisualTone;
};

export type RuntimeImmersionState = {
  phase: RuntimeImmersionPhase;
  elapsedMs: number;
  progress: number;
  attentionFocus: RuntimeAttentionFocus;
  operationalIntensity: RuntimeOperationalIntensity;
  attentionDepth: number;
  reveal: RuntimeRevealSequence;
  focusCue: RuntimeFocusCue;
  atmosphere: RuntimeAtmosphereState;
  reducedMotion: boolean;
};

function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }

export function deriveOperationalIntensity(input: { orchestration: RuntimeWorldOrchestration; temporalMemory: RuntimeTemporalMemory; graph: RuntimeEntityGraph }): RuntimeOperationalIntensity {
  const pressureScore = input.orchestration.operationalPressure === "critical" ? 3 : input.orchestration.operationalPressure === "high" ? 2 : input.orchestration.operationalPressure === "moderate" ? 1 : 0;
  const blockerScore = input.graph.traversal.blockers.some((b) => b.priority === "critical") ? 2 : input.graph.traversal.blockers.length > 0 ? 1 : 0;
  const stressScore = input.temporalMemory.volatility === "severe" ? 2 : input.temporalMemory.volatility === "volatile" ? 1 : 0;
  const total = pressureScore + blockerScore + stressScore;
  if (total >= 6) return "critical";
  if (total >= 4) return "high";
  if (total >= 2) return "moderate";
  return "low";
}

export function deriveRuntimeAtmosphere(input: { inheritedSeed: string; intensity: RuntimeOperationalIntensity; orchestration: RuntimeWorldOrchestration; temporalMemory: RuntimeTemporalMemory; graph: RuntimeEntityGraph; progress: number; reducedMotion: boolean }): RuntimeAtmosphereState {
  const p = clamp01(input.progress);
  const tension = input.intensity === "critical" ? 1 : input.intensity === "high" ? 0.78 : input.intensity === "moderate" ? 0.54 : 0.32;
  const resilienceFactor = input.temporalMemory.resilience === "strong" ? 0.06 : input.temporalMemory.resilience === "moderate" ? 0 : -0.06;
  const blockerFactor = Math.min(0.18, input.graph.traversal.blockers.length * 0.06);
  const momentumFactor = input.orchestration.flowMomentum === "building" ? 0.06 : input.orchestration.flowMomentum === "slipping" ? -0.04 : 0;
  const continuityFactor = input.orchestration.attentionState === "resume" ? 0.08 : 0;
  const base = clamp01(tension + resilienceFactor + blockerFactor + momentumFactor + continuityFactor);
  const easing = input.reducedMotion ? 1 : p;
  const tone: RuntimePressureVisualTone = input.intensity === "critical" ? "acute" : input.intensity === "high" ? "tense" : input.intensity === "moderate" ? "balanced" : "soft";
  return {
    inheritedSeed: input.inheritedSeed,
    ambientGlow: 0.18 + base * 0.36 * easing,
    panelContrast: 0.82 + base * 0.28,
    focusDepth: input.reducedMotion ? 0 : (1 - p) * (0.8 - base * 0.24),
    continuityGlow: 0.22 + base * 0.42,
    spacingDensity: 1 - base * 0.1,
    visualTone: tone,
  };
}

export function deriveImmersionPhase(input: { progress: number; orchestration: RuntimeWorldOrchestration }): RuntimeImmersionPhase {
  if (input.orchestration.recoveryState.needsRecovery) return "recovering";
  if (input.progress < 0.22) return "arriving";
  if (input.progress < 0.52) return "stabilizing";
  if (input.progress < 0.86) return "focusing";
  return "immersed";
}

export function deriveFocusPriority(input: { phase: RuntimeImmersionPhase; orchestration: RuntimeWorldOrchestration; graph: RuntimeEntityGraph }): RuntimeAttentionFocus {
  if (input.phase === "arriving" || input.phase === "stabilizing") return "primary";
  if (input.graph.traversal.blockers.length > 0) return "operator";
  if (input.phase === "focusing" && input.graph.dependencies.length > 0) return "continuity";
  if (input.orchestration.attentionState === "resume") return "workflow";
  return "secondary";
}

export function deriveAttentionDepth(input: { phase: RuntimeImmersionPhase; intensity: RuntimeOperationalIntensity; reducedMotion: boolean }): number {
  if (input.reducedMotion) return 0;
  const phaseDepth = input.phase === "arriving" ? 0.36 : input.phase === "stabilizing" ? 0.24 : input.phase === "focusing" ? 0.16 : 0.08;
  const intensityBoost = input.intensity === "critical" ? 0.2 : input.intensity === "high" ? 0.14 : input.intensity === "moderate" ? 0.08 : 0.02;
  return clamp01(phaseDepth + intensityBoost);
}

function revealAt(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return clamp01((progress - start) / (end - start));
}

export function deriveRuntimeImmersionState(input: { elapsedMs: number; durationMs: number; reducedMotion: boolean; inheritedSeed: string; orchestration: RuntimeWorldOrchestration; temporalMemory: RuntimeTemporalMemory; graph: RuntimeEntityGraph }): RuntimeImmersionState {
  const progress = input.reducedMotion ? 1 : clamp01(input.elapsedMs / input.durationMs);
  const operationalIntensity = deriveOperationalIntensity({ orchestration: input.orchestration, temporalMemory: input.temporalMemory, graph: input.graph });
  const phase = deriveImmersionPhase({ progress, orchestration: input.orchestration });
  const attentionFocus = deriveFocusPriority({ phase, orchestration: input.orchestration, graph: input.graph });
  const attentionDepth = deriveAttentionDepth({ phase, intensity: operationalIntensity, reducedMotion: input.reducedMotion });
  const atmosphere = deriveRuntimeAtmosphere({ inheritedSeed: input.inheritedSeed, intensity: operationalIntensity, orchestration: input.orchestration, temporalMemory: input.temporalMemory, graph: input.graph, progress, reducedMotion: input.reducedMotion });
  const secondaryCount = Math.max(2, input.graph.dependencies.length + 1);
  const secondaryReveal = Array.from({ length: secondaryCount }, (_, index) => {
    const offset = index * 0.08;
    return revealAt(progress, 0.22 + offset, 0.52 + offset);
  });
  const continuityResilience = input.temporalMemory.resilience === "strong" ? 1 : input.temporalMemory.resilience === "moderate" ? 0.72 : 0.4;
  const unresolvedDownstream = input.graph.traversal.blockers.length > 0 ? 0.8 : input.graph.dependencies.length > 1 ? 0.55 : 0.2;
  return {
    phase,
    elapsedMs: input.elapsedMs,
    progress,
    attentionFocus,
    operationalIntensity,
    attentionDepth,
    reveal: {
      primaryReveal: revealAt(progress, 0.06, 0.26),
      secondaryReveal,
      continuityReveal: revealAt(progress, 0.45, 0.74),
      lineageReveal: revealAt(progress, 0.55, 0.84),
      workflowReveal: revealAt(progress, 0.6, 0.92),
    },
    focusCue: {
      stablePointEmphasis: continuityResilience * revealAt(progress, 0.5, 0.82),
      resumeInterruptedFlowCue: input.temporalMemory.interruptions.length > 0 ? revealAt(progress, 0.52, 0.88) : 0,
      dormantReturnPulse: input.orchestration.dormancyState.isDormant ? revealAt(progress, 0.58, 0.94) : 0,
      blockerProximityEmphasis: unresolvedDownstream,
      dependencyVisibility: revealAt(progress, 0.4, 0.82),
      recoveryPathwayVisibility: input.orchestration.recoveryState.needsRecovery ? revealAt(progress, 0.22, 0.58) : 0.24,
    },
    atmosphere,
    reducedMotion: input.reducedMotion,
  };
}
