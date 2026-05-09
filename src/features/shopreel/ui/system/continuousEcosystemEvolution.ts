import type { AdaptiveProductionAtmosphereState } from "@/features/shopreel/ui/system/adaptiveProductionAtmosphere";
import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import type { EcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import type { GlobalEnvironmentContinuitySnapshot } from "@/features/shopreel/ui/system/globalEnvironmentContinuity";

export type ProductionWorldMode = "stable" | "compressed" | "recovering" | "stabilizing" | "dormant";
export type GlobalBias = "reduced" | "neutral" | "elevated";

export type ContinuousEcosystemRouteMemory = {
  previousRoute: string;
  currentRoute: string;
  routeTransitionCount: number;
  lastWorldMode: ProductionWorldMode;
  lastEscalationLevel: GlobalEnvironmentContinuitySnapshot["escalationState"];
  lastExportMomentum: number;
  lastRenderInstability: number;
  lastRecoveryCorridor: GlobalEnvironmentContinuitySnapshot["recoveryCorridor"];
  lastContinuityFracture: number;
  lastDormantInfluence: number;
  lastUpdatedAt: string;
};

export type ContinuousEcosystemEvolutionState = {
  environmentalContinuity: number;
  routePersistence: number;
  escalationCarryover: number;
  exportMomentumPersistence: number;
  continuityFractureSpread: number;
  renderInstabilityInfluence: number;
  dormantNavigationCooling: number;
  recoveryCorridorCalming: number;
  worldCohesion: number;
  productionWorldMode: ProductionWorldMode;
  globalDensityBias: GlobalBias;
  globalHierarchyBias: GlobalBias;
  globalAtmosphereBias: GlobalBias;
  globalNavigationBias: GlobalBias;
  globalFrictionBias: GlobalBias;
  globalRecoveryBias: GlobalBias;
  explanation: string;
};

export const CONTINUOUS_ECOSYSTEM_MEMORY_KEY = "shopreel-continuous-ecosystem-v1";
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const DEFAULT_ROUTE_MEMORY: ContinuousEcosystemRouteMemory = {
  previousRoute: "/shopreel",
  currentRoute: "/shopreel",
  routeTransitionCount: 0,
  lastWorldMode: "stable",
  lastEscalationLevel: "calm",
  lastExportMomentum: 24,
  lastRenderInstability: 18,
  lastRecoveryCorridor: "stable",
  lastContinuityFracture: 16,
  lastDormantInfluence: 24,
  lastUpdatedAt: new Date(0).toISOString(),
};

export function readContinuousEcosystemRouteMemory(): ContinuousEcosystemRouteMemory {
  if (typeof window === "undefined") return DEFAULT_ROUTE_MEMORY;
  const raw = window.localStorage.getItem(CONTINUOUS_ECOSYSTEM_MEMORY_KEY);
  if (!raw) return DEFAULT_ROUTE_MEMORY;
  try {
    return { ...DEFAULT_ROUTE_MEMORY, ...(JSON.parse(raw) as Partial<ContinuousEcosystemRouteMemory>) };
  } catch {
    return DEFAULT_ROUTE_MEMORY;
  }
}

export function deriveContinuousEcosystemEvolution(args: {
  continuity: GlobalEnvironmentContinuitySnapshot;
  ecosystem: EcosystemStateSnapshot;
  atmosphere: AdaptiveProductionAtmosphereState | null;
  memory: WorkspaceMemory | null;
  routeContext: string;
}): { state: ContinuousEcosystemEvolutionState; routeMemory: ContinuousEcosystemRouteMemory } {
  const persisted = readContinuousEcosystemRouteMemory();
  const unchangedRoute = persisted.currentRoute === args.routeContext;
  const routeTransitionCount = persisted.routeTransitionCount + (unchangedRoute ? 0 : 1);
  const routePersistence = clamp(Math.min(100, 45 + routeTransitionCount * 3 + (unchangedRoute ? 10 : 0)));
  const environmentalContinuity = clamp(args.ecosystem.continuityHealth * 0.72 + routePersistence * 0.28);
  const escalationCarryover = clamp((args.continuity.escalationState === "critical" ? 88 : args.continuity.escalationState === "elevated" ? 68 : args.continuity.escalationState === "steady" ? 44 : 24) * 0.72 + (persisted.lastEscalationLevel === "critical" ? 26 : persisted.lastEscalationLevel === "elevated" ? 18 : 10));
  const exportMomentumPersistence = clamp(args.continuity.exportMomentum * 0.74 + persisted.lastExportMomentum * 0.26);
  const renderInstabilityInfluence = clamp(args.continuity.renderInstability * 0.78 + persisted.lastRenderInstability * 0.22);
  const continuityFractureSpread = clamp(args.continuity.continuityFracture * 0.8 + persisted.lastContinuityFracture * 0.2);
  const dormantNavigationCooling = clamp(args.continuity.dormantInfluence * 0.7 + persisted.lastDormantInfluence * 0.3);
  const recoveryCorridorCalming = clamp((args.continuity.recoveryCorridor === "stable" ? 80 : args.continuity.recoveryCorridor === "forming" ? 58 : 20) * 0.7 + (persisted.lastRecoveryCorridor === "stable" ? 20 : persisted.lastRecoveryCorridor === "forming" ? 12 : 6));
  const workflowPressure = clamp((args.memory?.pendingTasks.filter((task) => !task.done).length ?? 0) * 7 + (args.memory?.operationalGraph?.environmentalInterpretation.topologyStress ?? 0));
  const worldCohesion = clamp(environmentalContinuity * 0.52 + recoveryCorridorCalming * 0.2 + (100 - continuityFractureSpread) * 0.18 + (100 - workflowPressure) * 0.1);

  const productionWorldMode: ProductionWorldMode = recoveryCorridorCalming >= 70 ? "recovering" : continuityFractureSpread >= 64 ? "stabilizing" : dormantNavigationCooling >= 64 ? "dormant" : escalationCarryover >= 60 || renderInstabilityInfluence >= 58 ? "compressed" : "stable";

  const globalDensityBias: GlobalBias = productionWorldMode === "compressed" ? "elevated" : productionWorldMode === "recovering" ? "reduced" : "neutral";
  const globalHierarchyBias: GlobalBias = exportMomentumPersistence >= 60 ? "elevated" : recoveryCorridorCalming >= 72 ? "reduced" : "neutral";
  const globalAtmosphereBias: GlobalBias = worldCohesion >= 70 ? "reduced" : continuityFractureSpread >= 60 ? "elevated" : "neutral";
  const globalNavigationBias: GlobalBias = dormantNavigationCooling >= 58 ? "reduced" : escalationCarryover >= 64 ? "elevated" : "neutral";
  const globalFrictionBias: GlobalBias = renderInstabilityInfluence >= 60 || continuityFractureSpread >= 56 ? "elevated" : recoveryCorridorCalming >= 68 ? "reduced" : "neutral";
  const globalRecoveryBias: GlobalBias = recoveryCorridorCalming >= 60 ? "elevated" : "neutral";

  const explanation = `${productionWorldMode} world · escalation ${escalationCarryover} · export momentum ${exportMomentumPersistence} · recovery ${recoveryCorridorCalming}`;
  return {
    routeMemory: {
      previousRoute: persisted.currentRoute,
      currentRoute: args.routeContext,
      routeTransitionCount,
      lastWorldMode: productionWorldMode,
      lastEscalationLevel: args.continuity.escalationState,
      lastExportMomentum: exportMomentumPersistence,
      lastRenderInstability: renderInstabilityInfluence,
      lastRecoveryCorridor: args.continuity.recoveryCorridor,
      lastContinuityFracture: continuityFractureSpread,
      lastDormantInfluence: dormantNavigationCooling,
      lastUpdatedAt: new Date().toISOString(),
    },
    state: {
      environmentalContinuity,
      routePersistence,
      escalationCarryover,
      exportMomentumPersistence,
      continuityFractureSpread,
      renderInstabilityInfluence,
      dormantNavigationCooling,
      recoveryCorridorCalming,
      worldCohesion,
      productionWorldMode,
      globalDensityBias,
      globalHierarchyBias,
      globalAtmosphereBias,
      globalNavigationBias,
      globalFrictionBias,
      globalRecoveryBias,
      explanation,
    },
  };
}

export function persistContinuousEcosystemRouteMemory(memory: ContinuousEcosystemRouteMemory): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONTINUOUS_ECOSYSTEM_MEMORY_KEY, JSON.stringify(memory));
}
