import type { RuntimeEntityGraph } from "@/features/shopreel/ui/system/runtimeEntityGraph";
import type { RuntimeImmersionState } from "@/features/shopreel/ui/system/runtimeImmersion";
import type { RuntimeTemporalMemory } from "@/features/shopreel/ui/system/runtimeTemporalMemory";
import type { RuntimeInteractionState } from "@/features/shopreel/ui/system/runtimeInteractionPolish";
import type { RuntimeWorldOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";

export type RuntimeSurfaceDepth = "flush" | "blended" | "embedded" | "anchored";
export type RuntimeSurfaceAttention = "ambient" | "guided" | "focused" | "recovery";

export type RuntimeAmbientField = {
  ambientBlend: number;
  gradientStrength: number;
  edgeSoftening: number;
  interactionDensity: number;
  continuityRailTone: number;
  operatorRailTone: number;
};

export type RuntimeContinuityField = {
  continuityStrength: number;
  resilienceWeight: number;
  returnFocusWeight: number;
  dormantPresenceWeight: number;
  workflowEmphasis: number;
};

export type RuntimeEnvironmentalPressure = {
  tension: number;
  spacingPressure: number;
  contrastPressure: number;
  blockerTension: number;
};

export type RuntimePanelCohesion = {
  relationshipIntensity: number;
  chainSync: number;
  sharedDepth: RuntimeSurfaceDepth;
  sharedAtmosphere: number;
};

export type RuntimeEmbeddedPresence = {
  continuityBreathing: number;
  ambientSettling: number;
  dormantWorkflowPresence: number;
  persistenceCue: number;
  restoredFocus: number;
};

export type RuntimeSurfaceState = {
  depth: RuntimeSurfaceDepth;
  attention: RuntimeSurfaceAttention;
  ambient: RuntimeAmbientField;
  continuity: RuntimeContinuityField;
  pressure: RuntimeEnvironmentalPressure;
  panelCohesion: RuntimePanelCohesion;
  presence: RuntimeEmbeddedPresence;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function deriveAmbientField(input: { orchestration: RuntimeWorldOrchestration; immersion: RuntimeImmersionState; interaction: RuntimeInteractionState; reducedMotion: boolean }): RuntimeAmbientField {
  const pressure = input.orchestration.operationalPressure === "critical" ? 1 : input.orchestration.operationalPressure === "high" ? 0.72 : input.orchestration.operationalPressure === "moderate" ? 0.48 : 0.24;
  const blend = clamp01(0.36 + pressure * 0.3 + input.immersion.atmosphere.ambientGlow * 0.2);
  return {
    ambientBlend: blend,
    gradientStrength: clamp01(0.24 + input.immersion.atmosphere.continuityGlow * 0.45),
    edgeSoftening: input.reducedMotion ? 0.14 : clamp01(0.12 + input.interaction.panelRelationshipIntensity * 0.2),
    interactionDensity: clamp01(0.28 + (input.interaction.actionDensity === "high-pressure" ? 0.48 : input.interaction.actionDensity === "dense" ? 0.34 : input.interaction.actionDensity === "guided" ? 0.2 : 0.1)),
    continuityRailTone: clamp01(0.34 + input.interaction.continuityAttention * 0.5),
    operatorRailTone: clamp01(0.3 + (1 - input.interaction.operatorGuidance.railNoiseSuppression) * 0.6),
  };
}

export function deriveContinuityField(input: { temporalMemory: RuntimeTemporalMemory; orchestration: RuntimeWorldOrchestration; graph: RuntimeEntityGraph }): RuntimeContinuityField {
  const resilience = input.temporalMemory.resilience === "strong" ? 0.9 : input.temporalMemory.resilience === "moderate" ? 0.62 : 0.34;
  const dormant = input.orchestration.dormancyState.isDormant ? clamp01(input.orchestration.dormancyState.dormantMinutes / 240) : 0;
  return {
    continuityStrength: clamp01(0.3 + resilience * 0.36 + input.graph.dependencies.length * 0.06),
    resilienceWeight: resilience,
    returnFocusWeight: input.orchestration.attentionState === "resume" ? 0.82 : 0.28,
    dormantPresenceWeight: dormant,
    workflowEmphasis: clamp01(0.22 + input.graph.traversal.upstream.length * 0.08 + input.graph.traversal.downstream.length * 0.06),
  };
}

export function deriveSurfaceDepth(input: { orchestration: RuntimeWorldOrchestration; continuity: RuntimeContinuityField; reducedMotion: boolean }): RuntimeSurfaceDepth {
  if (input.orchestration.operationalPressure === "critical") return "anchored";
  if (input.continuity.continuityStrength > 0.72) return "embedded";
  if (input.reducedMotion || input.orchestration.operationalPressure === "moderate") return "blended";
  return "flush";
}

export function derivePanelCohesion(input: { graph: RuntimeEntityGraph; interaction: RuntimeInteractionState; continuity: RuntimeContinuityField; depth: RuntimeSurfaceDepth }): RuntimePanelCohesion {
  const chainSize = input.graph.dependencies.length + input.graph.traversal.blockers.length;
  return {
    relationshipIntensity: clamp01(0.24 + input.interaction.panelRelationshipIntensity * 0.62),
    chainSync: clamp01(0.2 + chainSize * 0.12 + input.continuity.workflowEmphasis * 0.32),
    sharedDepth: input.depth,
    sharedAtmosphere: clamp01(0.3 + input.continuity.continuityStrength * 0.4),
  };
}

export function deriveEmbeddedPresence(input: { continuity: RuntimeContinuityField; orchestration: RuntimeWorldOrchestration; temporalMemory: RuntimeTemporalMemory; immersion: RuntimeImmersionState }): RuntimeEmbeddedPresence {
  const interruption = clamp01(input.temporalMemory.interruptions.length * 0.14);
  return {
    continuityBreathing: clamp01(0.2 + input.continuity.continuityStrength * 0.36),
    ambientSettling: clamp01(0.18 + input.immersion.progress * 0.62),
    dormantWorkflowPresence: input.continuity.dormantPresenceWeight,
    persistenceCue: clamp01(0.22 + interruption + input.continuity.returnFocusWeight * 0.32),
    restoredFocus: input.orchestration.attentionState === "resume" ? 0.86 : 0.34,
  };
}

export function deriveEnvironmentalPressure(input: { orchestration: RuntimeWorldOrchestration; temporalMemory: RuntimeTemporalMemory; graph: RuntimeEntityGraph; continuity: RuntimeContinuityField }): RuntimeEnvironmentalPressure {
  const base = input.orchestration.operationalPressure === "critical" ? 0.92 : input.orchestration.operationalPressure === "high" ? 0.74 : input.orchestration.operationalPressure === "moderate" ? 0.5 : 0.28;
  const graphTension = clamp01((input.graph.traversal.blockers.length * 0.16) + (input.graph.dependencies.length * 0.08));
  return {
    tension: clamp01(base + graphTension * 0.34),
    spacingPressure: clamp01(0.2 + base * 0.38 + (1 - input.continuity.resilienceWeight) * 0.3),
    contrastPressure: clamp01(0.24 + base * 0.5 + input.continuity.workflowEmphasis * 0.2),
    blockerTension: clamp01(graphTension + (input.temporalMemory.recoveries.length > 0 ? 0.14 : 0)),
  };
}

export function deriveRuntimeSurfaceState(input: { orchestration: RuntimeWorldOrchestration; immersion: RuntimeImmersionState; interaction: RuntimeInteractionState; temporalMemory: RuntimeTemporalMemory; graph: RuntimeEntityGraph; reducedMotion: boolean }): RuntimeSurfaceState {
  const continuity = deriveContinuityField({ temporalMemory: input.temporalMemory, orchestration: input.orchestration, graph: input.graph });
  const ambient = deriveAmbientField({ orchestration: input.orchestration, immersion: input.immersion, interaction: input.interaction, reducedMotion: input.reducedMotion });
  const depth = deriveSurfaceDepth({ orchestration: input.orchestration, continuity, reducedMotion: input.reducedMotion });
  const panelCohesion = derivePanelCohesion({ graph: input.graph, interaction: input.interaction, continuity, depth });
  const presence = deriveEmbeddedPresence({ continuity, orchestration: input.orchestration, temporalMemory: input.temporalMemory, immersion: input.immersion });
  const pressure = deriveEnvironmentalPressure({ orchestration: input.orchestration, temporalMemory: input.temporalMemory, graph: input.graph, continuity });
  const attention: RuntimeSurfaceAttention = input.orchestration.recoveryState.needsRecovery ? "recovery" : input.orchestration.attentionState === "focused" ? "focused" : input.interaction.attention === "guided" || input.interaction.attention === "urgent" ? "guided" : "ambient";
  return { depth, attention, ambient, continuity, pressure, panelCohesion, presence };
}
