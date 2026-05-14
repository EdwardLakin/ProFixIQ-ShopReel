import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export type RuntimeAttentionEngineInput = {
  worldId: RuntimeWorldId;
  unresolvedApprovals: number;
  activeRenderJobs: number;
  stalledWorlds: number;
  continuityDecay: number;
  missionUrgency: number;
  interactionRecencyWeight: number;
  runtimeMomentum: number;
  operationalFatigue: number;
  unresolvedOperationalState: number;
};

export type RuntimeAttentionEngineOutput = {
  suggestedFocalWorld: RuntimeWorldId;
  escalationPressure: number;
  interruptionPriority: "low" | "medium" | "high";
  continuityRetentionStrength: number;
  atmosphericTension: number;
};

export function deriveRuntimeAttention(input: RuntimeAttentionEngineInput): RuntimeAttentionEngineOutput {
  const approvalPressure = clamp01(input.unresolvedApprovals / 6);
  const renderPressure = clamp01(input.activeRenderJobs / 8);
  const stallPressure = clamp01(input.stalledWorlds / 4);
  const escalationPressure = clamp01(approvalPressure * 0.25 + renderPressure * 0.2 + stallPressure * 0.2 + input.missionUrgency * 0.2 + input.unresolvedOperationalState * 0.15);
  const continuityRetentionStrength = clamp01((1 - input.continuityDecay) * 0.5 + input.runtimeMomentum * 0.35 + input.interactionRecencyWeight * 0.15);
  const atmosphericTension = clamp01(escalationPressure * 0.65 + input.operationalFatigue * 0.2 + (1 - continuityRetentionStrength) * 0.15);
  const interruptionPriority: RuntimeAttentionEngineOutput["interruptionPriority"] = atmosphericTension > 0.72 ? "high" : atmosphericTension > 0.45 ? "medium" : "low";

  return {
    suggestedFocalWorld: input.worldId,
    escalationPressure,
    interruptionPriority,
    continuityRetentionStrength,
    atmosphericTension,
  };
}
