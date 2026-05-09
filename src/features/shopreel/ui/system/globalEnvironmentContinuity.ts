import type { EcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import { readWorkspaceMemory, writeWorkspaceMemory, type WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";

export type EscalationState = "calm" | "steady" | "elevated" | "critical";
export type RecoveryCorridor = "none" | "forming" | "stable";
export type GlobalEnvironmentTone = "calm_continuity" | "operational_tension" | "export_drive" | "recovery_stabilization";

export type GlobalEnvironmentContinuitySnapshot = {
  atmosphericContinuity: string;
  escalationState: EscalationState;
  exportMomentum: number;
  continuityFracture: number;
  renderInstability: number;
  dormantInfluence: number;
  recoveryCorridor: RecoveryCorridor;
  routeTransitionMemory: string;
  globalEnvironmentTone: GlobalEnvironmentTone;
  explainability: string[];
};

export type PersistedGlobalEnvironmentMemory = {
  lastAtmosphere: string;
  lastEscalationLevel: EscalationState;
  lastExportMomentum: number;
  lastRecoveryState: RecoveryCorridor;
  lastRouteContext: string;
  updatedAt: string;
};

const CONTINUITY_KEY = "shopreel-global-environment-v1";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const EMPTY_PERSISTED: PersistedGlobalEnvironmentMemory = {
  lastAtmosphere: "calm continuity",
  lastEscalationLevel: "calm",
  lastExportMomentum: 24,
  lastRecoveryState: "stable",
  lastRouteContext: "/shopreel",
  updatedAt: new Date(0).toISOString(),
};

export function readGlobalEnvironmentMemory(): PersistedGlobalEnvironmentMemory {
  if (typeof window === "undefined") return EMPTY_PERSISTED;
  const raw = window.localStorage.getItem(CONTINUITY_KEY);
  if (!raw) return EMPTY_PERSISTED;
  try {
    return { ...EMPTY_PERSISTED, ...(JSON.parse(raw) as Partial<PersistedGlobalEnvironmentMemory>) };
  } catch {
    return EMPTY_PERSISTED;
  }
}

export function deriveGlobalEnvironmentContinuity(args: {
  memory: WorkspaceMemory | null;
  ecosystem: EcosystemStateSnapshot;
  routeContext: string;
}): GlobalEnvironmentContinuitySnapshot {
  const persisted = readGlobalEnvironmentMemory();
  const blockers = args.memory?.pendingTasks.filter((task) => !task.done && /render|review|verify|publish/i.test(task.label)).length ?? 0;
  const unresolvedTasks = args.memory?.pendingTasks.filter((task) => !task.done).length ?? 0;
  const continuityThreads = args.memory?.continuityThreads?.length ?? 0;
  const renderInstability = clamp(args.ecosystem.renderPressure * 0.72 + blockers * 8);
  const dormantInfluence = clamp((unresolvedTasks - blockers) * 10 + (args.memory?.worldState?.operationalAging ?? 0) * 0.25);
  const continuityFracture = clamp((100 - args.ecosystem.continuityHealth) * 0.64 + renderInstability * 0.2 + (continuityThreads === 0 ? 14 : 0));
  const recoveryPressure = clamp(args.ecosystem.recoveryPriority * 0.64 + (100 - continuityFracture) * 0.16 - blockers * 4);

  const escalationState: EscalationState = renderInstability >= 76 || blockers >= 4
    ? "critical"
    : renderInstability >= 58 || args.ecosystem.operationalPressure >= 62
      ? "elevated"
      : args.ecosystem.operationalPressure >= 40
        ? "steady"
        : "calm";

  const recoveryCorridor: RecoveryCorridor = recoveryPressure >= 68 ? "stable" : recoveryPressure >= 44 ? "forming" : "none";
  const globalEnvironmentTone: GlobalEnvironmentTone = recoveryCorridor === "stable"
    ? "recovery_stabilization"
    : args.ecosystem.exportMomentum >= 64
      ? "export_drive"
      : escalationState === "critical" || escalationState === "elevated"
        ? "operational_tension"
        : "calm_continuity";

  const atmosphericContinuity = args.ecosystem.atmosphericLabel || persisted.lastAtmosphere;
  const routeTransitionMemory = `${persisted.lastRouteContext} → ${args.routeContext}`;
  return {
    atmosphericContinuity,
    escalationState,
    exportMomentum: clamp(args.ecosystem.exportMomentum * 0.78 + persisted.lastExportMomentum * 0.22),
    continuityFracture,
    renderInstability,
    dormantInfluence,
    recoveryCorridor,
    routeTransitionMemory,
    globalEnvironmentTone,
    explainability: [
      `Render instability ${renderInstability} from render pressure ${args.ecosystem.renderPressure} with ${blockers} blocker lanes.`,
      `Export momentum ${args.ecosystem.exportMomentum} remains visible from ready-state pressure signals.`,
      recoveryCorridor === "stable"
        ? "Recovery corridor stable from high recovery priority and reduced fracture pressure."
        : recoveryCorridor === "forming"
          ? "Recovery corridor forming as continuity pressure starts to normalize."
          : "Recovery corridor inactive while operational pressure remains dominant.",
    ],
  };
}

export function persistGlobalEnvironmentContinuity(snapshot: GlobalEnvironmentContinuitySnapshot, routeContext: string): void {
  if (typeof window === "undefined") return;
  const nextMemory: PersistedGlobalEnvironmentMemory = {
    lastAtmosphere: snapshot.atmosphericContinuity,
    lastEscalationLevel: snapshot.escalationState,
    lastExportMomentum: snapshot.exportMomentum,
    lastRecoveryState: snapshot.recoveryCorridor,
    lastRouteContext: routeContext,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(CONTINUITY_KEY, JSON.stringify(nextMemory));

  const workspace = readWorkspaceMemory();
  if (workspace) {
    writeWorkspaceMemory({ ...workspace, updatedAt: new Date().toISOString() });
  }
}
