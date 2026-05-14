import type { OperatorRuntimeSessionState } from "@/features/shopreel/ui/system/operatorRuntimeSession";
import type { OperatorRuntimeState, OperatorSurfaceId } from "@/features/shopreel/ui/system/operatorRuntime";
import type { RuntimeWorldEntryIntent, RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import type { GuidedFlowStepId } from "@/features/shopreel/ui/system/guidedWorldFlow";
import type { RuntimeTemporalMemory } from "@/features/shopreel/ui/system/runtimeTemporalMemory";
import type { RuntimeSpatialOrchestrationState } from "@/features/shopreel/ui/system/runtimeSpatialOrchestrator";

export const RUNTIME_SESSION_KEY = "shopreel-operator-runtime-session-v2";

export type PersistedChamberMemoryTrace = {
  runtimeState: OperatorRuntimeState;
  surface: OperatorSurfaceId;
  interruptionReason: string | null;
  timestamp: string;
};

export type PersistedChamberMemory = {
  lastKnownRuntimeState: OperatorRuntimeState;
  lastKnownSurface: OperatorSurfaceId;
  interruptionCount: number;
  restorationCount: number;
  traces: PersistedChamberMemoryTrace[];
};

export type PersistedRuntimeSession = {
  activeCampaignId: string | null;
  activeSurface: OperatorSurfaceId;
  previousSurface: OperatorSurfaceId | null;
  progressionStage: OperatorRuntimeState;
  interruptionReason: string | null;
  returnTarget: string;
  updatedAt: string;
  activeWorldId: RuntimeWorldId | null;
  previousWorldId: RuntimeWorldId | null;
  worldEntryIntent: RuntimeWorldEntryIntent | null;
  worldRecommendation: string | null;
  worldEntrySnapshot: {
    worldId: RuntimeWorldId;
    href: string;
    entityId: string | null;
    entityKind: string | null;
    title: string;
    status: string;
    visualSeed: string;
    guidedStep: GuidedFlowStepId | null;
  } | null;
  chamberMemory: PersistedChamberMemory;
  worldPersistence: {
    chamberIdentity: string;
    continuityMemory: string[];
    lastFocalSurface: string | null;
    unresolvedApprovals: number;
    activeRenderState: string | null;
    activeExecutionLane: string | null;
    missionTrajectory: "forward" | "deeper" | "recess" | "wider";
    pressureWeight: number;
    focalNode: string | null;
    approvalState: "pending" | "approved" | "blocked" | null;
    renderProgress: number;
    unresolvedItems: number;
    environmentalPressure: number;
    topologyIntensity: number;
    aiGuidanceContext: string[];
    spatialOrchestration?: Partial<RuntimeSpatialOrchestrationState>;
  };
  worldContinuity: OperatorRuntimeSessionState["worldContinuity"];
  temporalMemory?: RuntimeTemporalMemory;
};

const MAX_MEMORY_TRACES = 6;

export function persistRuntimeSession(session: OperatorRuntimeSessionState): void {
  if (typeof window === "undefined") return;
  const previous = readPersistedRuntimeSession();
  const previousMemory = previous?.chamberMemory;
  const nextTrace: PersistedChamberMemoryTrace = {
    runtimeState: session.runtimeState,
    surface: session.activeSurface,
    interruptionReason: session.interruption?.reason ?? null,
    timestamp: new Date().toISOString(),
  };
  const traces = [nextTrace, ...(previousMemory?.traces ?? [])]
    .filter((trace, index, arr) => arr.findIndex((candidate) => candidate.runtimeState === trace.runtimeState && candidate.surface === trace.surface && candidate.interruptionReason === trace.interruptionReason) === index)
    .slice(0, MAX_MEMORY_TRACES);

  const payload: PersistedRuntimeSession = {
    activeCampaignId: session.selectedEntityIds.campaignId,
    activeSurface: session.activeSurface,
    previousSurface: session.previousSurface,
    progressionStage: session.runtimeState,
    interruptionReason: session.interruption?.reason ?? null,
    returnTarget: session.fallbackRoute,
    updatedAt: new Date().toISOString(),
    activeWorldId: session.activeWorldId,
    previousWorldId: session.previousWorldId,
    worldEntryIntent: session.worldEntryIntent,
    worldRecommendation: session.worldRecommendation,
    worldEntrySnapshot: session.worldEntrySnapshot,
    chamberMemory: {
      lastKnownRuntimeState: session.runtimeState,
      lastKnownSurface: session.activeSurface,
      interruptionCount: (previousMemory?.interruptionCount ?? 0) + (session.interruption ? 1 : 0),
      restorationCount: (previousMemory?.restorationCount ?? 0) + (session.pendingTransition === "restore_previous" ? 1 : 0),
      traces,
    },
    worldPersistence: previous?.worldPersistence ?? {
      chamberIdentity: "runtime_chamber",
      continuityMemory: [],
      lastFocalSurface: null,
      unresolvedApprovals: 0,
      activeRenderState: null,
      activeExecutionLane: null,
      missionTrajectory: "forward",
      pressureWeight: 0.3,
      focalNode: null,
      approvalState: null,
      renderProgress: 0,
      unresolvedItems: 0,
      environmentalPressure: 0.2,
      topologyIntensity: 0.2,
      aiGuidanceContext: [],
      spatialOrchestration: {
        activeChamberVector: { x: 0, y: 0, z: 0, worldId: session.activeWorldId ?? "campaign" },
        atmosphericDensity: 0.3,
        ambientDrift: 0.2,
        tensionField: 0.25,
        focalGravity: 0.5,
        interruptionTrajectory: { worldId: null, intensity: 0, directionalBias: "stabilize" },
        worldAdjacencyMap: {},
        environmentalMotionProfile: { lowFrequencyMotion: 0.2, pressureGradient: 0.3, continuityBias: 0.4, directionalFlow: 0.5 },
      },
    },
    worldContinuity: session.worldContinuity,
    temporalMemory: previous?.temporalMemory,
  };
  window.localStorage.setItem(RUNTIME_SESSION_KEY, JSON.stringify(payload));
}

export function readPersistedRuntimeSession(): PersistedRuntimeSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(RUNTIME_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedRuntimeSession;
    if (!parsed || typeof parsed !== "object" || typeof parsed.updatedAt !== "string" || typeof parsed.returnTarget !== "string") {
      window.localStorage.removeItem(RUNTIME_SESSION_KEY);
      return null;
    }
    if (!parsed.chamberMemory) {
      return {
        ...parsed,
        chamberMemory: {
          lastKnownRuntimeState: parsed.progressionStage,
          lastKnownSurface: parsed.activeSurface,
          interruptionCount: parsed.interruptionReason ? 1 : 0,
          restorationCount: 0,
          traces: [{
            runtimeState: parsed.progressionStage,
            surface: parsed.activeSurface,
            interruptionReason: parsed.interruptionReason,
            timestamp: parsed.updatedAt,
          }],
        },
        worldContinuity: parsed.worldContinuity ?? {
          activeWorldId: parsed.activeWorldId,
          activeWorldKind: null,
          activeEntityId: parsed.worldEntrySnapshot?.entityId ?? null,
          activeRoute: parsed.worldEntrySnapshot?.href ?? null,
          previousWorldId: parsed.previousWorldId,
          previousRoute: null,
          guidedStepId: parsed.worldEntrySnapshot?.guidedStep ?? null,
          panelMode: "operator",
          environment: {
            visualSeed: parsed.worldEntrySnapshot?.visualSeed ?? "operations:default",
            backgroundTone: "slate",
            returnToDeckHref: "/shopreel",
          },
          lastAction: null,
          breadcrumbs: [],
          openPanels: ["primary"],
          collapsedPanels: [],
          focusedPanelId: null,
          lastViewedSection: null,
          worldScrollY: 0,
          lastManualToolOpened: null,
          lastEmbeddedRoute: null,
          activeGuidedQuestion: null,
          entityContinuity: {
            recentEntityTraversal: [],
            previousEntityChain: [],
            lastRelationshipHop: null,
            upstreamContinuity: [],
            downstreamContinuity: [],
            lastActiveDependencyChain: [],
            activeBlockerLineage: [],
          },
        },
      };
    }

    if (!parsed.worldPersistence) {
      parsed.worldPersistence = {
        chamberIdentity: "runtime_chamber",
        continuityMemory: [],
        lastFocalSurface: parsed.worldContinuity?.focusedPanelId ?? null,
        unresolvedApprovals: 0,
        activeRenderState: null,
        activeExecutionLane: null,
        missionTrajectory: "forward",
        pressureWeight: 0.3,
        focalNode: null,
        approvalState: null,
        renderProgress: 0,
        unresolvedItems: 0,
        environmentalPressure: 0.2,
        topologyIntensity: 0.2,
        aiGuidanceContext: [],
        spatialOrchestration: {
          activeChamberVector: { x: 0, y: 0, z: 0, worldId: parsed.activeWorldId ?? "campaign" },
          atmosphericDensity: 0.3,
          ambientDrift: 0.2,
          tensionField: 0.25,
          focalGravity: 0.5,
          interruptionTrajectory: { worldId: null, intensity: 0, directionalBias: "stabilize" },
          worldAdjacencyMap: {},
          environmentalMotionProfile: { lowFrequencyMotion: 0.2, pressureGradient: 0.3, continuityBias: 0.4, directionalFlow: 0.5 },
        },
      };
    }
    if (!parsed.worldPersistence.focalNode) parsed.worldPersistence.focalNode = null;
    if (!["pending", "approved", "blocked", null].includes(parsed.worldPersistence.approvalState as never)) parsed.worldPersistence.approvalState = null;
    if (!Number.isFinite(parsed.worldPersistence.renderProgress)) parsed.worldPersistence.renderProgress = 0;
    if (!Number.isFinite(parsed.worldPersistence.unresolvedItems)) parsed.worldPersistence.unresolvedItems = 0;
    if (!Number.isFinite(parsed.worldPersistence.environmentalPressure)) parsed.worldPersistence.environmentalPressure = 0.2;
    if (!Number.isFinite(parsed.worldPersistence.topologyIntensity)) parsed.worldPersistence.topologyIntensity = 0.2;
    if (!Array.isArray(parsed.worldPersistence.aiGuidanceContext)) parsed.worldPersistence.aiGuidanceContext = [];
    if (!parsed.worldPersistence.spatialOrchestration || typeof parsed.worldPersistence.spatialOrchestration !== "object") parsed.worldPersistence.spatialOrchestration = {};
    const spatial = parsed.worldPersistence.spatialOrchestration;
    if (!Number.isFinite(spatial.ambientDrift)) spatial.ambientDrift = 0.2;
    if (!Number.isFinite(spatial.atmosphericDensity)) spatial.atmosphericDensity = 0.3;
    if (!Number.isFinite(spatial.tensionField)) spatial.tensionField = 0.25;
    if (!Number.isFinite(spatial.focalGravity)) spatial.focalGravity = 0.5;
    if (!spatial.environmentalMotionProfile || typeof spatial.environmentalMotionProfile !== "object") spatial.environmentalMotionProfile = { lowFrequencyMotion: 0.2, pressureGradient: 0.3, continuityBias: 0.4, directionalFlow: 0.5 };
    if (!spatial.worldAdjacencyMap || typeof spatial.worldAdjacencyMap !== "object") spatial.worldAdjacencyMap = {};

    if (!parsed.worldContinuity) {
      parsed.worldContinuity = {
        activeWorldId: parsed.activeWorldId,
        activeWorldKind: null,
        activeEntityId: parsed.worldEntrySnapshot?.entityId ?? null,
        activeRoute: parsed.worldEntrySnapshot?.href ?? null,
        previousWorldId: parsed.previousWorldId,
        previousRoute: null,
        guidedStepId: parsed.worldEntrySnapshot?.guidedStep ?? null,
        panelMode: "operator",
        environment: { visualSeed: parsed.worldEntrySnapshot?.visualSeed ?? "operations:default", backgroundTone: "slate", returnToDeckHref: "/shopreel" },
        lastAction: null,
        breadcrumbs: [],
        openPanels: ["primary"],
        collapsedPanels: [],
        focusedPanelId: null,
        lastViewedSection: null,
        worldScrollY: 0,
        lastManualToolOpened: null,
        lastEmbeddedRoute: null,
        activeGuidedQuestion: null,
        entityContinuity: {
          recentEntityTraversal: [],
          previousEntityChain: [],
          lastRelationshipHop: null,
          upstreamContinuity: [],
          downstreamContinuity: [],
          lastActiveDependencyChain: [],
          activeBlockerLineage: [],
        },
      };
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(RUNTIME_SESSION_KEY);
    return null;
  }
}

export function persistWorldEntrySnapshot(snapshot: NonNullable<PersistedRuntimeSession["worldEntrySnapshot"]>): void {
  if (typeof window === "undefined") return;
  const existing = readPersistedRuntimeSession();
  if (!existing) return;
  window.localStorage.setItem(RUNTIME_SESSION_KEY, JSON.stringify({ ...existing, worldEntrySnapshot: snapshot, updatedAt: new Date().toISOString() }));
}
