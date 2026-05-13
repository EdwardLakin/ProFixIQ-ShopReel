import { buildOperationalGraph } from "@/features/shopreel/ui/system/operationalGraph";
import { resolveRuntimeSurfaceFromRoute, type RuntimeSurfaceId } from "@/features/shopreel/ui/system/runtimeOrchestration";

export type RuntimeOperationalGraph = {
  activeRuntimeNode: RuntimeSurfaceId;
  adjacentReachableSurfaces: RuntimeSurfaceId[];
  continuityVectors: { pressure: number; momentum: number };
  operatorMomentum: number;
  unresolvedTrajectoryGraph: string[];
  transitionEligibility: boolean;
};

export function deriveRuntimeOperationalGraph(input: { route: string; pendingTaskCount: number; blockerCount: number; readyTaskCount: number; interrupted: boolean; continuityThreadCount: number; campaignId?: string; generationId?: string }): RuntimeOperationalGraph {
  const graph = buildOperationalGraph({ ...input, lastRoute: input.route });
  const active = resolveRuntimeSurfaceFromRoute(input.route).id;
  const adjacentReachableSurfaces = resolveRuntimeSurfaceFromRoute(input.route).runtimeDependencies;
  return {
    activeRuntimeNode: active,
    adjacentReachableSurfaces,
    continuityVectors: { pressure: graph.continuityPressure / 100, momentum: graph.readinessPropagation / 100 },
    operatorMomentum: Math.max(0, Math.min(1, (graph.readinessPropagation - graph.continuityPressure + 100) / 200)),
    unresolvedTrajectoryGraph: graph.recoveryCandidates,
    transitionEligibility: graph.recoveryCandidates.length > 0 || graph.readinessPropagation > 30,
  };
}
