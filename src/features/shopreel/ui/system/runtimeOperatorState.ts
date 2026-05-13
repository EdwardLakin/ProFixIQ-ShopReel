import type { RuntimeFieldSystem } from "@/features/shopreel/ui/system/runtimeFieldSystem";

export type RuntimeOperatorPresenceField = { stabilization: number; continuityGuidance: number; recoveryBias: number; attentionStabilization: number };
export type RuntimeOperatorGuidanceMemory = { lastGuidanceLabel: string | null; interventionCount: number };
export type RuntimeOperatorContinuityState = "steady" | "stabilizing" | "recovery";

export function deriveRuntimeOperatorState(input: { fieldSystem: RuntimeFieldSystem; unresolvedCount: number; lastGuidanceLabel: string | null }): { presenceField: RuntimeOperatorPresenceField; guidanceMemory: RuntimeOperatorGuidanceMemory; continuityState: RuntimeOperatorContinuityState } {
  const stabilization = Math.min(1, input.fieldSystem.operatorStabilizationField);
  const continuityGuidance = Math.min(1, input.fieldSystem.continuityField * 0.6 + (1 - input.fieldSystem.interruptionField) * 0.4);
  const recoveryBias = Math.min(1, input.unresolvedCount / 4);
  return {
    presenceField: { stabilization, continuityGuidance, recoveryBias, attentionStabilization: Math.min(1, stabilization * 0.7 + continuityGuidance * 0.3) },
    guidanceMemory: { lastGuidanceLabel: input.lastGuidanceLabel, interventionCount: input.unresolvedCount },
    continuityState: recoveryBias > 0.66 ? "recovery" : stabilization > 0.55 ? "stabilizing" : "steady",
  };
}
