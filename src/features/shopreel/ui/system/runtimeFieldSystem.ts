import type { RuntimeWorldState } from "@/features/shopreel/ui/system/runtimeWorldState";

export type RuntimeFieldSystem = {
  attentionField: number;
  workloadField: number;
  urgencyField: number;
  recoveryField: number;
  orchestrationDensityField: number;
  interruptionField: number;
  continuityField: number;
  operatorStabilizationField: number;
};

export function deriveRuntimeFieldSystem(world: RuntimeWorldState): RuntimeFieldSystem {
  const attentionField = Math.min(1, world.memory.attentionHistory * 0.6 + world.pressure.unresolvedPressure * 0.4);
  const workloadField = world.pressure.workflowPressure;
  const urgencyField = Math.min(1, world.pressure.unresolvedPressure * 0.7 + world.continuity.unresolvedPressure * 0.3);
  const recoveryField = world.recovery === "stable" ? 0.3 : world.recovery === "decompressing" ? 0.6 : 0.85;
  const orchestrationDensityField = world.pressure.chamberDensity;
  const interruptionField = Math.min(1, urgencyField * 0.55 + (1 - world.temporal.rhythm) * 0.45);
  const continuityField = world.temporal.continuityMomentum;
  const operatorStabilizationField = Math.min(1, recoveryField * 0.6 + interruptionField * 0.4);
  return { attentionField, workloadField, urgencyField, recoveryField, orchestrationDensityField, interruptionField, continuityField, operatorStabilizationField };
}
