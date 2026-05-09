import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import type { OperatorBehaviorMemory } from "@/features/shopreel/ui/system/operatorBehaviorAdaptation";
import type { GlobalEnvironmentContinuitySnapshot } from "@/features/shopreel/ui/system/globalEnvironmentContinuity";

export type StrategicOperationalMemory = {
  recurringWorkflowPatterns: Record<string, number>;
  repeatedRecoveryPaths: Record<string, number>;
  exportFirstTendency: number;
  renderMonitoringHabit: number;
  continuityRestorationFrequency: number;
  escalationFrequency: number;
  dormantReturnBehavior: number;
  commandPreferencePatterns: Record<string, number>;
  routePersistencePatterns: Record<string, number>;
  recoverySuccessHistory: number;
  stabilizationPreference: number;
};

export type StrategicAdaptationSnapshot = {
  strategicPriorityBias: number;
  continuityRoutingBias: number;
  exportBias: number;
  renderBias: number;
  recoveryBias: number;
  explorationBias: number;
  stabilizationBias: number;
  escalationBias: number;
  orchestrationBias: number;
  continuityTrustBias: number;
  interruptionSensitivity: number;
  operationalDiscipline: number;
  momentumPreservation: number;
  fatigueAvoidance: number;
  focusPersistence: number;
  recoveryPersistence: number;
  commandOrderingBias: "export" | "render" | "recovery" | "explore" | "balanced";
  shellDensityBias: "dense" | "balanced" | "calm";
  continuityVisibilityBias: "elevated" | "balanced" | "background";
  operationalPersonality: "calm_continuity" | "aggressive_export" | "exploration_oriented" | "stabilization_oriented" | "render_monitoring" | "recovery_centric";
  likelyNextRoute: string;
  explanation: string[];
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const STORAGE_KEY = "shopreel-strategic-adaptation-v1";

const defaultStrategicMemory = (): StrategicOperationalMemory => ({
  recurringWorkflowPatterns: {}, repeatedRecoveryPaths: {}, exportFirstTendency: 0, renderMonitoringHabit: 0,
  continuityRestorationFrequency: 0, escalationFrequency: 0, dormantReturnBehavior: 0, commandPreferencePatterns: {}, routePersistencePatterns: {},
  recoverySuccessHistory: 0, stabilizationPreference: 0,
});

export function readStrategicOperationalMemory(): StrategicOperationalMemory {
  if (typeof window === "undefined") return defaultStrategicMemory();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStrategicMemory();
    return { ...defaultStrategicMemory(), ...(JSON.parse(raw) as Partial<StrategicOperationalMemory>) };
  } catch {
    return defaultStrategicMemory();
  }
}

function writeStrategicOperationalMemory(memory: StrategicOperationalMemory): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function evolveStrategicOperationalMemory(input: { workspace: WorkspaceMemory | null; operator: OperatorBehaviorMemory; continuity: GlobalEnvironmentContinuitySnapshot }): StrategicOperationalMemory {
  const memory = readStrategicOperationalMemory();
  const next = { ...memory };
  const route = input.workspace?.lastRoute ?? "/shopreel";
  next.recurringWorkflowPatterns[input.workspace?.lastWorkflow ?? "unknown"] = (next.recurringWorkflowPatterns[input.workspace?.lastWorkflow ?? "unknown"] ?? 0) + 1;
  next.routePersistencePatterns[route] = (next.routePersistencePatterns[route] ?? 0) + 1;
  if (input.continuity.recoveryCorridor !== "none") next.repeatedRecoveryPaths[route] = (next.repeatedRecoveryPaths[route] ?? 0) + 1;
  next.exportFirstTendency += input.operator.exportCount > input.operator.renderCheckCount ? 1 : 0;
  next.renderMonitoringHabit += input.operator.renderCheckCount >= input.operator.exportCount ? 1 : 0;
  next.continuityRestorationFrequency += input.operator.continuationCount > 0 ? 1 : 0;
  next.escalationFrequency += input.continuity.escalationState === "critical" || input.continuity.escalationState === "elevated" ? 1 : 0;
  next.dormantReturnBehavior += input.operator.interruptionCount > 0 ? 1 : 0;
  next.commandPreferencePatterns[input.workspace?.lastCommand?.toLowerCase() ?? "unknown"] = (next.commandPreferencePatterns[input.workspace?.lastCommand?.toLowerCase() ?? "unknown"] ?? 0) + 1;
  next.recoverySuccessHistory += input.operator.continuationCount > input.operator.blockerEncounterCount ? 1 : 0;
  next.stabilizationPreference += input.operator.recoveryCount > 0 ? 1 : 0;
  writeStrategicOperationalMemory(next);
  return next;
}

export function deriveStrategicAdaptation(input: { workspace: WorkspaceMemory | null; operator: OperatorBehaviorMemory; continuity: GlobalEnvironmentContinuitySnapshot; strategicMemory?: StrategicOperationalMemory }): StrategicAdaptationSnapshot {
  const strategicMemory = input.strategicMemory ?? readStrategicOperationalMemory();
  const exportBias = clamp((input.operator.exportCount * 7) + strategicMemory.exportFirstTendency * 4);
  const renderBias = clamp((input.operator.renderCheckCount * 7) + strategicMemory.renderMonitoringHabit * 4);
  const recoveryBias = clamp((input.operator.recoveryCount * 8) + strategicMemory.continuityRestorationFrequency * 4);
  const explorationBias = clamp((Object.keys(input.operator.routeFrequency).length * 10) + (input.operator.continuationCount < 2 ? 18 : 0));
  const stabilizationBias = clamp((strategicMemory.stabilizationPreference * 5) + (strategicMemory.recoverySuccessHistory * 4));
  const escalationBias = clamp((strategicMemory.escalationFrequency * 7) + input.continuity.renderInstability * 0.25);
  const continuityRoutingBias = clamp((strategicMemory.continuityRestorationFrequency * 5) + (Object.keys(strategicMemory.repeatedRecoveryPaths).length * 10));
  const continuityTrustBias = clamp((strategicMemory.recoverySuccessHistory * 6) + (100 - input.continuity.continuityFracture) * 0.35);
  const interruptionSensitivity = clamp((input.operator.interruptionCount * 11) + (strategicMemory.dormantReturnBehavior * 4));
  const operationalDiscipline = clamp((input.operator.continuationCount * 12) + strategicMemory.recoverySuccessHistory * 4 - input.operator.blockerEncounterCount * 6);
  const momentumPreservation = clamp(exportBias * 0.5 + renderBias * 0.2 + continuityTrustBias * 0.25);
  const fatigueAvoidance = clamp(stabilizationBias * 0.45 + interruptionSensitivity * 0.4 + (100 - escalationBias) * 0.2);
  const focusPersistence = clamp(operationalDiscipline * 0.55 + continuityRoutingBias * 0.25 + momentumPreservation * 0.2);
  const recoveryPersistence = clamp(recoveryBias * 0.5 + interruptionSensitivity * 0.2 + continuityRoutingBias * 0.3);
  const orchestrationBias = clamp((focusPersistence * 0.36) + (continuityTrustBias * 0.34) + (momentumPreservation * 0.3));
  const strategicPriorityBias = clamp(Math.max(exportBias, renderBias, recoveryBias, explorationBias, stabilizationBias));

  const commandOrderingBias: StrategicAdaptationSnapshot["commandOrderingBias"] = exportBias > renderBias && exportBias > recoveryBias
    ? "export" : renderBias > recoveryBias ? "render" : recoveryBias > explorationBias ? "recovery" : explorationBias > 60 ? "explore" : "balanced";
  const shellDensityBias: StrategicAdaptationSnapshot["shellDensityBias"] = interruptionSensitivity > 65 || escalationBias > 68 ? "dense" : stabilizationBias > 55 ? "calm" : "balanced";
  const continuityVisibilityBias: StrategicAdaptationSnapshot["continuityVisibilityBias"] = continuityRoutingBias > 62 ? "elevated" : explorationBias > 55 ? "background" : "balanced";

  const operationalPersonality: StrategicAdaptationSnapshot["operationalPersonality"] =
    exportBias > 68 ? "aggressive_export" : renderBias > 68 ? "render_monitoring" : recoveryPersistence > 68 ? "recovery_centric" :
    explorationBias > 64 ? "exploration_oriented" : stabilizationBias > 62 ? "stabilization_oriented" : "calm_continuity";

  const likelyNextRoute = commandOrderingBias === "export" ? "/shopreel/exports" : commandOrderingBias === "render" ? "/shopreel/render-queue" : commandOrderingBias === "recovery" ? "/shopreel/review" : "/shopreel";

  return {
    strategicPriorityBias, continuityRoutingBias, exportBias, renderBias, recoveryBias, explorationBias, stabilizationBias, escalationBias,
    orchestrationBias, continuityTrustBias, interruptionSensitivity, operationalDiscipline, momentumPreservation, fatigueAvoidance, focusPersistence, recoveryPersistence,
    commandOrderingBias, shellDensityBias, continuityVisibilityBias, operationalPersonality, likelyNextRoute,
    explanation: [
      exportBias > 55 ? "Export systems elevated due to repeated export momentum." : "Export systems held balanced from limited export-first history.",
      interruptionSensitivity > 55 ? "Recovery corridors preserved due to interruption history." : "Recovery corridors normalized from stable continuity rhythm.",
      shellDensityBias === "calm" ? "Navigation density reduced from continuity-focused rhythm." : "Navigation density balanced against live operational pressure.",
    ],
  };
}
