import type { GuidedFlowStepId } from "@/features/shopreel/ui/system/guidedWorldFlow";
import type { RuntimeWorldComposition } from "@/features/shopreel/ui/system/runtimeWorldComposition";
import type { RuntimeWorldChoreography } from "@/features/shopreel/ui/system/runtimeWorldChoreography";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeWorldFlowHealth = "healthy" | "progressing" | "stalled" | "blocked" | "recovering" | "abandoned" | "dormant" | "resolved";
export type RuntimeWorldFlowMomentum = "building" | "steady" | "slipping" | "stopped";
export type RuntimeWorldOperationalPressure = "low" | "moderate" | "high" | "critical";
export type RuntimeWorldAttentionState = "focused" | "monitoring" | "escalated" | "recovery" | "resume";
export type RuntimeWorldRecoveryState = { needsRecovery: boolean; cue: string | null; hint: string | null; failedAttempts: number };
export type RuntimeWorldDormancyState = { isDormant: boolean; dormantMinutes: number; thresholdMinutes: number; cue: string | null };
export type RuntimeWorldEscalationState = { needsEscalation: boolean; thresholdMinutes: number; reason: string | null };
export type RuntimeWorldOperatorPriority = {
  highestPressureWorld: RuntimeWorldId;
  highestRecoveryNeedWorld: RuntimeWorldId;
  mostBlockedFlowWorld: RuntimeWorldId;
  mostActionableWorld: RuntimeWorldId;
  recommendedReturnWorld: RuntimeWorldId;
  safestNextStep: string;
};

export type RuntimeWorldOrchestration = {
  worldId: RuntimeWorldId;
  flowHealth: RuntimeWorldFlowHealth;
  flowMomentum: RuntimeWorldFlowMomentum;
  operationalPressure: RuntimeWorldOperationalPressure;
  attentionState: RuntimeWorldAttentionState;
  recoveryState: RuntimeWorldRecoveryState;
  dormancyState: RuntimeWorldDormancyState;
  escalationState: RuntimeWorldEscalationState;
  unresolvedPressureCount: number;
};

type Input = {
  worldId: RuntimeWorldId;
  status: string;
  blockers: string[];
  unresolvedCount: number;
  guidedStepId: GuidedFlowStepId | null;
  previousWorldId: RuntimeWorldId | null;
  lastActionLabel: string | null;
  breadcrumbs: Array<{ worldId: RuntimeWorldId | null; at?: string }>;
  composition: RuntimeWorldComposition;
  choreography?: RuntimeWorldChoreography | null;
  now: string;
  failedProgressionAttempts?: number;
  lastTransitionAt?: string | null;
  graphSignals?: { dependencyDepth: number; blockerFanout: number; stalledDownstreamCount: number; unresolvedLineageCount: number; abandonedChainCount: number; orphanedWorld: boolean; unresolvedReviewTreeCount: number } | null;
};

function minutesSince(iso: string | null | undefined, now: Date): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const parsed = new Date(iso).getTime();
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - parsed) / 60000));
}

export function deriveRuntimeFlowHealth(input: Input): RuntimeWorldFlowHealth {
  const status = input.status.toLowerCase();
  const hasBlockers = input.blockers.length > 0 || /failed|error|blocked/.test(status);
  const now = new Date(input.now);
  const latestBreadcrumbAt = input.breadcrumbs.at(-1)?.at ?? null;
  const inactiveMinutes = minutesSince(input.lastTransitionAt ?? latestBreadcrumbAt, now);

  if (/resolved|published|complete/.test(status)) return "resolved";
  if (hasBlockers) return /recover|retry/.test(status) ? "recovering" : "blocked";
  if (inactiveMinutes >= 180 && input.previousWorldId !== input.worldId) return "abandoned";
  if (inactiveMinutes >= 90) return "dormant";
  if (/pending|review|approval/.test(status) && inactiveMinutes >= 45) return "stalled";
  if (/draft|running|active|processing|render/.test(status)) return "progressing";
  return "healthy";
}

export function deriveRuntimeFlowMomentum(input: { flowHealth: RuntimeWorldFlowHealth; unresolvedCount: number; failedProgressionAttempts: number }): RuntimeWorldFlowMomentum {
  if (input.flowHealth === "blocked" || input.flowHealth === "abandoned") return "stopped";
  if (input.failedProgressionAttempts > 1 || input.flowHealth === "stalled") return "slipping";
  if (input.unresolvedCount > 0 || input.flowHealth === "recovering") return "steady";
  return "building";
}

export function deriveRuntimeOperationalPressure(input: { flowHealth: RuntimeWorldFlowHealth; unresolvedCount: number; blockers: string[]; escalation: boolean; graphSignals?: Input["graphSignals"] }): RuntimeWorldOperationalPressure {
  if (input.flowHealth === "blocked" || input.blockers.length > 0 || input.escalation) return "critical";
  if (input.flowHealth === "recovering" || input.unresolvedCount > 2) return "high";
  if (input.flowHealth === "stalled" || input.unresolvedCount > 0) return "moderate";
  return "low";
}

export function deriveRuntimeRecoveryState(input: Input): RuntimeWorldRecoveryState {
  const status = input.status.toLowerCase();
  const failedAttempts = input.failedProgressionAttempts ?? 0;
  if (input.worldId === "upload" && /missing|empty|none/.test(status)) {
    return { needsRecovery: true, cue: "Missing assets detected", hint: "Use upload tools or manual operations before continuing.", failedAttempts };
  }
  if (input.worldId === "render" && /failed|error/.test(status)) {
    return { needsRecovery: true, cue: "Render recovery required", hint: "Re-run render path and inspect blockers.", failedAttempts };
  }
  if (/blocked|failed|error/.test(status)) {
    return { needsRecovery: true, cue: "Operational recovery needed", hint: input.lastActionLabel ? `Resume from ${input.lastActionLabel}.` : "Resume from the last recorded action.", failedAttempts };
  }
  return { needsRecovery: false, cue: null, hint: null, failedAttempts };
}

export function deriveRuntimeDormancyState(input: Input): RuntimeWorldDormancyState {
  const now = new Date(input.now);
  const latestBreadcrumbAt = input.breadcrumbs.at(-1)?.at ?? null;
  const dormantMinutes = minutesSince(input.lastTransitionAt ?? latestBreadcrumbAt, now);
  const thresholdMinutes = input.worldId === "publish" ? 30 : input.worldId === "review" ? 40 : 90;
  const isDormant = dormantMinutes >= thresholdMinutes;
  return {
    isDormant,
    dormantMinutes,
    thresholdMinutes,
    cue: isDormant ? `Dormant for ${dormantMinutes}m.` : null,
  };
}

export function deriveRuntimeEscalationState(input: { worldId: RuntimeWorldId; flowHealth: RuntimeWorldFlowHealth; unresolvedCount: number; dormant: RuntimeWorldDormancyState }): RuntimeWorldEscalationState {
  const thresholdMinutes = input.worldId === "review" ? 60 : 120;
  const needsEscalation = input.flowHealth === "blocked" || (input.unresolvedCount > 0 && input.dormant.dormantMinutes >= thresholdMinutes);
  return { needsEscalation, thresholdMinutes, reason: needsEscalation ? `Unresolved flow exceeded ${thresholdMinutes}m threshold.` : null };
}

export function deriveRuntimeAttentionState(input: { flowHealth: RuntimeWorldFlowHealth; recovery: RuntimeWorldRecoveryState; dormancy: RuntimeWorldDormancyState; escalation: RuntimeWorldEscalationState }): RuntimeWorldAttentionState {
  if (input.escalation.needsEscalation) return "escalated";
  if (input.recovery.needsRecovery) return "recovery";
  if (input.flowHealth === "dormant" || input.dormancy.isDormant) return "resume";
  if (input.flowHealth === "progressing") return "focused";
  return "monitoring";
}

export function deriveRuntimeOrchestration(input: Input): RuntimeWorldOrchestration {
  const flowHealth = deriveRuntimeFlowHealth(input);
  const recoveryState = deriveRuntimeRecoveryState(input);
  const dormancyState = deriveRuntimeDormancyState(input);
  const escalationState = deriveRuntimeEscalationState({ worldId: input.worldId, flowHealth, unresolvedCount: input.unresolvedCount, dormant: dormancyState });
  const flowMomentum = deriveRuntimeFlowMomentum({ flowHealth, unresolvedCount: input.unresolvedCount, failedProgressionAttempts: recoveryState.failedAttempts });
  const operationalPressure = deriveRuntimeOperationalPressure({ flowHealth, unresolvedCount: input.unresolvedCount, blockers: input.blockers, escalation: escalationState.needsEscalation, graphSignals: input.graphSignals ?? null });
  const attentionState = deriveRuntimeAttentionState({ flowHealth, recovery: recoveryState, dormancy: dormancyState, escalation: escalationState });

  return {
    worldId: input.worldId,
    flowHealth,
    flowMomentum,
    operationalPressure,
    attentionState,
    recoveryState,
    dormancyState,
    escalationState,
    unresolvedPressureCount: input.unresolvedCount + input.blockers.length,
  };
}

export function deriveRuntimeOperatorPriority(orchestrations: RuntimeWorldOrchestration[]): RuntimeWorldOperatorPriority | null {
  if (orchestrations.length === 0) return null;
  const pressureRank: Record<RuntimeWorldOperationalPressure, number> = { low: 1, moderate: 2, high: 3, critical: 4 };
  const byPressure = [...orchestrations].sort((a, b) => pressureRank[b.operationalPressure] - pressureRank[a.operationalPressure] || b.unresolvedPressureCount - a.unresolvedPressureCount);
  const highestPressureWorld = byPressure[0].worldId;
  const highestRecoveryNeedWorld = orchestrations.find((item) => item.recoveryState.needsRecovery)?.worldId ?? highestPressureWorld;
  const mostBlockedFlowWorld = orchestrations.find((item) => item.flowHealth === "blocked")?.worldId ?? highestPressureWorld;
  const mostActionableWorld = orchestrations.find((item) => item.attentionState === "focused" || item.flowHealth === "progressing")?.worldId ?? highestPressureWorld;
  const recommendedReturnWorld = orchestrations.find((item) => item.attentionState === "resume")?.worldId ?? mostActionableWorld;
  const safestNextStep = orchestrations.find((item) => item.recoveryState.needsRecovery)?.recoveryState.hint ?? "Continue through the highest pressure world using manual route controls.";

  return { highestPressureWorld, highestRecoveryNeedWorld, mostBlockedFlowWorld, mostActionableWorld, recommendedReturnWorld, safestNextStep };
}
