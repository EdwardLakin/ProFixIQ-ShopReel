import type { RuntimeEntityGraph } from "@/features/shopreel/ui/system/runtimeEntityGraph";
import type { RuntimeTemporalMemory } from "@/features/shopreel/ui/system/runtimeTemporalMemory";
import type { RuntimeWorldOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";

export type RuntimeActionPriority = "focus" | "continuity" | "approval" | "secondary" | "passive";
export type RuntimeDecisionFocus = "balanced" | "progressive" | "caution" | "recovery" | "critical";
export type RuntimeActionDensity = "quiet" | "guided" | "dense" | "high-pressure";
export type RuntimePanelRelationship = "isolated" | "aware" | "linked" | "chain";
export type RuntimeInteractionAttention = "stable" | "contextual" | "guided" | "urgent";
export type RuntimeGuidanceCue = {
  label: string;
  emphasis: number;
  continuityGlow: number;
  confidence: "neutral" | "supportive" | "assertive";
};
export type RuntimeOperatorGuidanceState = {
  railAttention: RuntimeInteractionAttention;
  continuityHealth: "healthy" | "watch" | "fragile";
  unresolvedTension: number;
  recoveryVisible: boolean;
  railNoiseSuppression: number;
};

export type RuntimeInteractionState = {
  attention: RuntimeInteractionAttention;
  actionPriority: RuntimeActionPriority;
  decisionFocus: RuntimeDecisionFocus;
  actionDensity: RuntimeActionDensity;
  panelRelationship: RuntimePanelRelationship;
  panelRelationshipIntensity: number;
  continuityAttention: number;
  operatorGuidance: RuntimeOperatorGuidanceState;
  guidanceCue: RuntimeGuidanceCue;
};

const pressureRank = { low: 1, moderate: 2, high: 3, critical: 4 } as const;

export function deriveInteractionPriority(input: { orchestration: RuntimeWorldOrchestration; temporalMemory: RuntimeTemporalMemory; graph: RuntimeEntityGraph }): RuntimeActionPriority {
  if (input.orchestration.attentionState === "focused") return "focus";
  if (input.orchestration.recoveryState.needsRecovery || input.temporalMemory.interruptions.length > 0) return "continuity";
  if (input.graph.traversal.blockers.length > 0 || input.orchestration.unresolvedPressureCount > 0) return "approval";
  if (input.orchestration.flowHealth === "progressing") return "secondary";
  return "passive";
}

export function deriveDecisionFocus(input: { priority: RuntimeActionPriority; orchestration: RuntimeWorldOrchestration }): RuntimeDecisionFocus {
  if (input.orchestration.operationalPressure === "critical") return "critical";
  if (input.orchestration.recoveryState.needsRecovery || input.priority === "continuity") return "recovery";
  if (input.priority === "approval") return "caution";
  if (input.priority === "focus") return "progressive";
  return "balanced";
}

export function deriveOperatorGuidance(input: { orchestration: RuntimeWorldOrchestration; temporalMemory: RuntimeTemporalMemory; continuityAttention: number }): RuntimeOperatorGuidanceState {
  const unresolvedTension = input.orchestration.unresolvedPressureCount + input.temporalMemory.interruptions.length;
  const continuityHealth = input.temporalMemory.resilience === "strong" ? "healthy" : input.temporalMemory.resilience === "moderate" ? "watch" : "fragile";
  const railAttention: RuntimeInteractionAttention = pressureRank[input.orchestration.operationalPressure] >= 4 ? "urgent" : unresolvedTension > 0 ? "guided" : input.continuityAttention > 0.45 ? "contextual" : "stable";
  return {
    railAttention,
    continuityHealth,
    unresolvedTension,
    recoveryVisible: input.orchestration.recoveryState.needsRecovery,
    railNoiseSuppression: railAttention === "stable" ? 0.82 : railAttention === "contextual" ? 0.65 : 0.3,
  };
}

export function deriveActionDensity(input: { orchestration: RuntimeWorldOrchestration; priority: RuntimeActionPriority }): RuntimeActionDensity {
  if (input.orchestration.operationalPressure === "critical") return "high-pressure";
  if (input.priority === "focus" || input.priority === "continuity") return "dense";
  if (input.orchestration.unresolvedPressureCount > 0) return "guided";
  return "quiet";
}

export function derivePanelRelationshipIntensity(input: { graph: RuntimeEntityGraph; orchestration: RuntimeWorldOrchestration; temporalMemory: RuntimeTemporalMemory }): { relationship: RuntimePanelRelationship; intensity: number } {
  const chain = input.graph.dependencies.length + input.graph.traversal.upstream.length + input.graph.traversal.blockers.length;
  if (chain >= 4 || input.orchestration.operationalPressure === "critical") return { relationship: "chain", intensity: 0.88 };
  if (chain >= 2 || input.temporalMemory.interruptions.length > 0) return { relationship: "linked", intensity: 0.7 };
  if (chain >= 1) return { relationship: "aware", intensity: 0.52 };
  return { relationship: "isolated", intensity: 0.34 };
}

export function deriveContinuityAttention(input: { temporalMemory: RuntimeTemporalMemory; orchestration: RuntimeWorldOrchestration }): number {
  const interruptionWeight = Math.min(0.45, input.temporalMemory.interruptions.length * 0.12);
  const recoveryWeight = input.orchestration.recoveryState.needsRecovery ? 0.3 : 0;
  const dormancyWeight = input.orchestration.dormancyState.isDormant ? 0.18 : 0;
  return Math.min(1, 0.2 + interruptionWeight + recoveryWeight + dormancyWeight);
}

export function deriveRuntimeInteractionState(input: { orchestration: RuntimeWorldOrchestration; temporalMemory: RuntimeTemporalMemory; graph: RuntimeEntityGraph }): RuntimeInteractionState {
  const actionPriority = deriveInteractionPriority(input);
  const decisionFocus = deriveDecisionFocus({ priority: actionPriority, orchestration: input.orchestration });
  const actionDensity = deriveActionDensity({ orchestration: input.orchestration, priority: actionPriority });
  const panel = derivePanelRelationshipIntensity(input);
  const continuityAttention = deriveContinuityAttention(input);
  const operatorGuidance = deriveOperatorGuidance({ orchestration: input.orchestration, temporalMemory: input.temporalMemory, continuityAttention });
  const attention: RuntimeInteractionAttention = operatorGuidance.railAttention;
  const guidanceCue: RuntimeGuidanceCue = {
    label: actionPriority === "focus" ? "Proceed with current focus" : actionPriority === "continuity" ? "Restore continuity path" : actionPriority === "approval" ? "Resolve approvals and blockers" : "Maintain operational flow",
    emphasis: actionDensity === "high-pressure" ? 0.92 : actionDensity === "dense" ? 0.72 : actionDensity === "guided" ? 0.56 : 0.4,
    continuityGlow: continuityAttention,
    confidence: decisionFocus === "critical" || decisionFocus === "recovery" ? "assertive" : decisionFocus === "progressive" ? "supportive" : "neutral",
  };
  return { attention, actionPriority, decisionFocus, actionDensity, panelRelationship: panel.relationship, panelRelationshipIntensity: panel.intensity, continuityAttention, operatorGuidance, guidanceCue };
}
