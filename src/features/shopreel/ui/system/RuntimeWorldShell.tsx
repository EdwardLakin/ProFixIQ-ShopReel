"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTransitionRouter } from "@/features/shopreel/ui/system/TransitionProvider";
import { persistRuntimeReturnState, readRuntimeSpatialTransition } from "@/features/shopreel/ui/system/runtimeSpatialTransition";
import RuntimeWorldWorkspaceCanvas from "@/features/shopreel/ui/system/RuntimeWorldWorkspaceCanvas";
import { deriveRuntimeChamberGeometry } from "@/features/shopreel/ui/system/runtimeChamberGeometry";
import { deriveRuntimeTraversal } from "@/features/shopreel/ui/system/runtimeTraversalEngine";
import { deriveRuntimePlaneGeometry } from "@/features/shopreel/ui/system/runtimePlaneGeometry";
import { deriveRuntimeSpatialCamera } from "@/features/shopreel/ui/system/runtimeSpatialCamera";
import { deriveRuntimeEnvironmentalIntelligence } from "@/features/shopreel/ui/system/runtimeEnvironmentalIntelligence";
import { deriveRuntimeChamberActions } from "@/features/shopreel/ui/system/runtimeChamberInteraction";
import { buildRuntimeSceneComposition } from "@/features/shopreel/ui/system/runtimeSceneGraph";
import { RuntimeSceneGraphCanvas } from "@/features/shopreel/ui/system/RuntimeSceneGraphCanvas";
import { RuntimeEnvironmentField } from "@/features/shopreel/ui/system/RuntimeEnvironmentField";
import { resolveGuidedFlowStep, resolveWorldGuidedPrompt } from "@/features/shopreel/ui/system/guidedWorldFlow";
import type { RuntimeWorldAction, RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import { RUNTIME_WORLD_MAP } from "@/features/shopreel/ui/system/runtimeWorldMap";
import { createWorldEntryTransition, deriveWorldTransitionClasses , type RuntimeWorldAmbientState, type RuntimeWorldIdentityTransition } from "@/features/shopreel/ui/system/runtimeWorldTransition";
import { deriveWorldChoreography } from "@/features/shopreel/ui/system/runtimeWorldChoreography";
import { deriveRuntimeImmersionState, type RuntimeImmersionState } from "@/features/shopreel/ui/system/runtimeImmersion";
import { deriveRuntimeOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";
import { buildRuntimeEntityGraph } from "@/features/shopreel/ui/system/runtimeEntityGraph";
import { buildRuntimeTemporalMemory } from "@/features/shopreel/ui/system/runtimeTemporalMemory";
import { deriveRuntimeInteractionState } from "@/features/shopreel/ui/system/runtimeInteractionPolish";
import { deriveRuntimeSurfaceState } from "@/features/shopreel/ui/system/runtimeSurfaceCohesion";
import { deriveRuntimeEnvironment } from "@/features/shopreel/ui/system/runtimeEnvironment";
import { persistWorldEntrySnapshot, readPersistedRuntimeSession } from "@/features/shopreel/ui/system/runtimeSessionPersistence";
import { deriveRuntimeSpatialMap } from "@/features/shopreel/ui/system/runtimeSpatialMap";
import { persistRuntimeOperatorPosition, readRuntimeOperatorPosition } from "@/features/shopreel/ui/system/runtimeOperatorPosition";

function actionForWorld(worldId: RuntimeWorldEntry["worldId"]): RuntimeWorldAction[] {
  return RUNTIME_WORLD_MAP[worldId].primaryActions.map((item) => ({ id: item.id, label: item.label, href: item.href ?? RUNTIME_WORLD_MAP[worldId].canonicalRoute }));
}

export default function RuntimeWorldShell({ entry, children }: { entry: RuntimeWorldEntry; children: ReactNode }) {
  const router = useRouter();
  const { activeTransition, advanceWorldEntryCamera, completeWorldEntryTransition } = useTransitionRouter();
  const persisted = readPersistedRuntimeSession();
  const rememberedPosition = readRuntimeOperatorPosition();
  const prompt = resolveWorldGuidedPrompt(entry.worldId);
  const guidedStepId = persisted?.worldContinuity.guidedStepId;
  const flow = guidedStepId ? resolveGuidedFlowStep(guidedStepId) : null;
  const manualActions = actionForWorld(entry.worldId);
  const identityTransition: RuntimeWorldIdentityTransition = createWorldEntryTransition({ mode: "resume_world", fromWorldId: persisted?.previousWorldId ?? null, toWorldId: entry.worldId, fromRoute: persisted?.worldContinuity.previousRoute ?? null, toRoute: persisted?.worldContinuity.activeRoute ?? entry.href, label: "resume", at: new Date().toISOString() }, false);
  const transitionClass = deriveWorldTransitionClasses(identityTransition);
  const transitionSnapshot = readRuntimeSpatialTransition();
  const inheritedSeed = transitionSnapshot?.snapshot.atmosphere.gradientSeed ?? persisted?.worldContinuity.environment.visualSeed ?? entry.visualSeed;
  const ambientState: RuntimeWorldAmbientState = { stabilized: true, visualSeed: inheritedSeed };
  const resolvedTransition = activeTransition && activeTransition.snapshot.href === entry.href && activeTransition.phase === "arrived" ? activeTransition : null;

  const [immersionElapsed, setImmersionElapsed] = useState(0);
  const prefersReducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    if (!resolvedTransition || resolvedTransition.phase !== "arrived") return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      setImmersionElapsed(now - start);
      if (now - start < 1200 && !prefersReducedMotion) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    if (resolvedTransition.reducedMotion) {
      completeWorldEntryTransition();
      return;
    }
    let rafA = 0;
    let rafB = 0;
    let rafC = 0;
    rafA = window.requestAnimationFrame(() => advanceWorldEntryCamera("focusing"));
    rafB = window.requestAnimationFrame(() => {
      rafC = window.requestAnimationFrame(() => {
        advanceWorldEntryCamera("immersed");
        completeWorldEntryTransition();
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
      window.cancelAnimationFrame(rafC);
    };
  }, [resolvedTransition, advanceWorldEntryCamera, completeWorldEntryTransition, prefersReducedMotion]);
  const nowIso = new Date().toISOString();
  const composition = { worldId: entry.worldId, panels: [] };
  const choreography = deriveWorldChoreography({
    worldId: entry.worldId,
    status: entry.status,
    blockers: entry.blockers,
    unresolvedCount: entry.unresolvedCount,
    guidedStepId: persisted?.worldContinuity.guidedStepId ?? null,
    previousWorldId: persisted?.previousWorldId ?? null,
    lastActionLabel: persisted?.worldContinuity.lastAction?.label ?? null,
    breadcrumbs: persisted?.worldContinuity.breadcrumbs ?? [],
    composition,
    availableActions: entry.primaryAction ? [entry.primaryAction, ...entry.secondaryActions] : entry.secondaryActions,
    transitionIntent: { mode: "resume_world", fromWorldId: persisted?.previousWorldId ?? null, toWorldId: entry.worldId, fromRoute: persisted?.worldContinuity.previousRoute ?? null, toRoute: persisted?.worldContinuity.activeRoute ?? entry.href, label: "resume", at: new Date().toISOString() },
  });
  const orchestration = deriveRuntimeOrchestration({
    worldId: entry.worldId,
    status: entry.status,
    blockers: entry.blockers,
    unresolvedCount: entry.unresolvedCount,
    guidedStepId: persisted?.worldContinuity.guidedStepId ?? null,
    previousWorldId: persisted?.previousWorldId ?? null,
    lastActionLabel: persisted?.worldContinuity.lastAction?.label ?? null,
    breadcrumbs: persisted?.worldContinuity.breadcrumbs ?? [],
    composition,
    choreography,
    now: nowIso,
    lastTransitionAt: persisted?.updatedAt ?? null,
  });
  const entityGraph = buildRuntimeEntityGraph({
    activeWorldId: entry.worldId,
    activeRoute: entry.href,
    previousWorldId: persisted?.previousWorldId ?? null,
    worldTransitionHistory: persisted?.worldContinuity.breadcrumbs.map((item) => ({ from: null, to: item.worldId, at: item.at, reason: item.label })) ?? [],
    worldSnapshot: persisted?.worldEntrySnapshot ? { entityId: persisted.worldEntrySnapshot.entityId, entityKind: persisted.worldEntrySnapshot.entityKind, title: persisted.worldEntrySnapshot.title, status: persisted.worldEntrySnapshot.status, href: persisted.worldEntrySnapshot.href } : null,
    continuity: { activeEntityId: persisted?.worldContinuity.activeEntityId ?? entry.entityId ?? null, breadcrumbs: persisted?.worldContinuity.breadcrumbs ?? [], activeRoute: persisted?.worldContinuity.activeRoute ?? entry.href },
    composition,
    status: entry.status,
    blockers: entry.blockers,
    unresolvedCount: entry.unresolvedCount,
  });
  const temporalMemory = buildRuntimeTemporalMemory({
    now: nowIso,
    activeWorldId: entry.worldId,
    status: entry.status,
    unresolvedCount: entry.unresolvedCount,
    blockers: entry.blockers,
    breadcrumbs: persisted?.worldContinuity.breadcrumbs ?? [],
    transitionHistory: (persisted?.worldContinuity.breadcrumbs ?? []).map((item) => ({ from: null, to: item.worldId, at: item.at, reason: item.label })),
    orchestration,
    choreography,
    entityGraph,
  });
  const interaction = deriveRuntimeInteractionState({ orchestration, temporalMemory, graph: entityGraph });
  const immersion: RuntimeImmersionState = deriveRuntimeImmersionState({
    elapsedMs: immersionElapsed,
    durationMs: 900,
    reducedMotion: prefersReducedMotion || Boolean(resolvedTransition?.reducedMotion),
    inheritedSeed,
    orchestration,
    temporalMemory,
    graph: entityGraph,
  });
  const surface = deriveRuntimeSurfaceState({ orchestration, immersion, interaction, temporalMemory, graph: entityGraph, reducedMotion: prefersReducedMotion || Boolean(resolvedTransition?.reducedMotion) });
  const environment = deriveRuntimeEnvironment({ entry, orchestration, interaction, surface, reducedMotion: prefersReducedMotion || Boolean(resolvedTransition?.reducedMotion) });
  const spatialMap = deriveRuntimeSpatialMap({ worldId: entry.worldId, previousWorldId: persisted?.previousWorldId ?? null, operator: rememberedPosition, environment, unresolvedCount: entry.unresolvedCount, blockers: entry.blockers });

  useEffect(() => {
    const priorVisited = rememberedPosition?.visitedWorlds ?? [];
    persistRuntimeOperatorPosition({
      worldId: entry.worldId,
      previousWorldId: persisted?.previousWorldId ?? null,
      focusDirection: environment.navigationField,
      continuityState: entry.unresolvedCount > 0 ? "recovering" : "stable",
      continuityVector: spatialMap.directionalShift,
      visitedWorlds: [entry.worldId, ...priorVisited.filter((worldId) => worldId !== entry.worldId)].slice(0, 12),
      at: new Date().toISOString(),
    });
  }, [entry.unresolvedCount, entry.worldId, environment.navigationField, persisted?.previousWorldId, rememberedPosition?.visitedWorlds, spatialMap.directionalShift]);

  const navigate = (href: string, step: string | null) => {
    persistWorldEntrySnapshot({ worldId: entry.worldId, href, entityId: entry.entityId, entityKind: entry.entityKind, title: entry.title, status: entry.status, visualSeed: entry.visualSeed, guidedStep: step as never });
    router.push(href);
  };

  const operatorPanel = <aside className={`rounded-2xl p-4 text-sm ${entry.panelClass}`}>
    <p>{flow?.question ?? prompt.question}</p>
    <p className="mt-2 text-xs text-cyan-100/80">{choreography.operatorCue.label} · {interaction.guidanceCue.label}</p>
    <div className="mt-2 grid gap-2 sm:grid-cols-2" aria-label="operator decision surface" data-attention={interaction.attention}>
      <button onClick={() => navigate(prompt.yes.href, prompt.yes.nextStep)} className="rounded-lg border border-emerald-300/40 bg-emerald-400/10 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Yes</button>
      <button onClick={() => navigate(prompt.no.href, prompt.no.nextStep)} className="rounded-lg border border-amber-200/40 bg-amber-300/10 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">No</button>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">{manualActions.map((action) => <Link key={action.id} href={action.href} className="rounded-full border border-white/20 px-3 py-1 text-xs">{action.label}</Link>)}</div>
    <div className="mt-4 flex gap-2"><Link href={persisted?.worldContinuity.environment.returnToDeckHref ?? "/shopreel"} onClick={() => persistRuntimeReturnState({ worldId: entry.worldId, scrollY: window.scrollY, restoreCardId: `${entry.entityKind ?? entry.worldKind}:${entry.entityId ?? entry.worldId}`, returnedAt: new Date().toISOString() })} className="rounded-lg border border-white/20 px-3 py-2 text-sm">Back to deck</Link><Link href={entry.manualSurfaceHref} className="rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-3 py-2 text-sm">Manual route escape</Link></div>
  </aside>;

  const chamber = deriveRuntimeChamberGeometry(entry.worldKind);
  const traversal = deriveRuntimeTraversal({ sourceWorld: persisted?.previousWorldId ?? null, targetWorld: entry.worldId, spatialMap, geometry: chamber, unresolvedCount: entry.unresolvedCount });
  const camera = deriveRuntimeSpatialCamera({ traversal, reducedMotion: prefersReducedMotion || Boolean(resolvedTransition?.reducedMotion), unresolvedCount: entry.unresolvedCount, continuityMomentum: traversal.continuityMomentum });
  const environmentalIntelligence = deriveRuntimeEnvironmentalIntelligence({ urgency: Math.min(1, entry.unresolvedCount / 4), workload: Math.min(1, entry.secondaryActions.length / 4), unresolvedBlockers: Math.min(1, entry.blockers.length / 4), renderQueueState: null, creativeIntensity: null, operationalState: traversal.environmentalCarryover, temporalVolatility: 1 - spatialMap.continuityMemory.continuityStrength, dependencyPressure: interaction.attention === "urgent" ? 1 : interaction.attention === "guided" ? 0.7 : 0.3, continuityResilience: spatialMap.continuityMemory.continuityStrength });
  const chamberActions = deriveRuntimeChamberActions({ primaryAction: entry.primaryAction, secondaryActions: entry.secondaryActions, manualHref: entry.manualSurfaceHref, blocked: entry.blockers.length > 0 });
  const planes = RuntimeWorldWorkspaceCanvas({ entry, children });
  const scene = buildRuntimeSceneComposition({ chamber, traversal, environment, spatialMap, reducedMotion: prefersReducedMotion || Boolean(resolvedTransition?.reducedMotion), foreground: planes.foreground, midground: planes.midground, background: planes.background, peripheral: planes.peripheral, operator: operatorPanel, atmosphere: <RuntimeEnvironmentField chamber={chamber} /> });
  const planeGeometry = deriveRuntimePlaneGeometry(entry.worldKind);

  return <div className={`relative min-h-screen overflow-hidden text-white ${entry.transitionClass} ${transitionClass.container} ${camera.inertia.easingClassName}`} data-world-seed={ambientState.visualSeed} style={{ transform: camera.inertia.translateScalar ? `translate3d(${camera.translate.x}px, ${camera.translate.y}px, 0)` : "none" }}>
    <div className="sr-only" aria-live="polite">{`Camera ${camera.mode}; focus ${camera.target}; chamber tension ${Math.round(environmentalIntelligence.chamberTension * 100)}; ${chamberActions[0]?.label ?? "No focal action"}`}</div>
    <RuntimeSceneGraphCanvas composition={scene} planesByDepth={planeGeometry} />
  </div>;
}
