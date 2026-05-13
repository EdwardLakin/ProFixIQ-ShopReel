"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTransitionRouter } from "@/features/shopreel/ui/system/TransitionProvider";
import { persistRuntimeReturnState, readRuntimeSpatialTransition } from "@/features/shopreel/ui/system/runtimeSpatialTransition";
import { deriveRuntimeWorldCamera } from "@/features/shopreel/ui/system/runtimeWorldSpatialModel";
import RuntimeWorldWorkspaceCanvas from "@/features/shopreel/ui/system/RuntimeWorldWorkspaceCanvas";
import { resolveGuidedFlowStep, resolveWorldGuidedPrompt } from "@/features/shopreel/ui/system/guidedWorldFlow";
import type { RuntimeWorldAction, RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import { RUNTIME_WORLD_MAP } from "@/features/shopreel/ui/system/runtimeWorldMap";
import { createWorldEntryTransition, deriveWorldTransitionClasses, type RuntimeWorldAmbientState, type RuntimeWorldFocusState, type RuntimeWorldIdentityTransition } from "@/features/shopreel/ui/system/runtimeWorldTransition";
import { deriveWorldChoreography } from "@/features/shopreel/ui/system/runtimeWorldChoreography";
import { deriveRuntimeImmersionState, type RuntimeImmersionState } from "@/features/shopreel/ui/system/runtimeImmersion";
import { deriveRuntimeOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";
import { buildRuntimeEntityGraph } from "@/features/shopreel/ui/system/runtimeEntityGraph";
import { buildRuntimeTemporalMemory } from "@/features/shopreel/ui/system/runtimeTemporalMemory";
import { deriveRuntimeInteractionState } from "@/features/shopreel/ui/system/runtimeInteractionPolish";
import { deriveRuntimeSurfaceState } from "@/features/shopreel/ui/system/runtimeSurfaceCohesion";
import { deriveRuntimeEnvironment } from "@/features/shopreel/ui/system/runtimeEnvironment";
import { persistWorldEntrySnapshot, readPersistedRuntimeSession } from "@/features/shopreel/ui/system/runtimeSessionPersistence";

function actionForWorld(worldId: RuntimeWorldEntry["worldId"]): RuntimeWorldAction[] {
  return RUNTIME_WORLD_MAP[worldId].primaryActions.map((item) => ({ id: item.id, label: item.label, href: item.href ?? RUNTIME_WORLD_MAP[worldId].canonicalRoute }));
}

export default function RuntimeWorldShell({ entry, children }: { entry: RuntimeWorldEntry; children: ReactNode }) {
  const router = useRouter();
  const { activeTransition, advanceWorldEntryCamera, completeWorldEntryTransition } = useTransitionRouter();
  const persisted = readPersistedRuntimeSession();
  const prompt = resolveWorldGuidedPrompt(entry.worldId);
  const guidedStepId = persisted?.worldContinuity.guidedStepId;
  const flow = guidedStepId ? resolveGuidedFlowStep(guidedStepId) : null;
  const manualActions = actionForWorld(entry.worldId);
  const identityTransition: RuntimeWorldIdentityTransition = createWorldEntryTransition({ mode: "resume_world", fromWorldId: persisted?.previousWorldId ?? null, toWorldId: entry.worldId, fromRoute: persisted?.worldContinuity.previousRoute ?? null, toRoute: persisted?.worldContinuity.activeRoute ?? entry.href, label: "resume", at: new Date().toISOString() }, false);
  const transitionClass = deriveWorldTransitionClasses(identityTransition);
  const focusState: RuntimeWorldFocusState = { focusedPanelId: persisted?.worldContinuity.focusedPanelId ?? null, activeGuidedQuestion: persisted?.worldContinuity.activeGuidedQuestion ?? null };
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

  const navigate = (href: string, step: string | null) => {
    persistWorldEntrySnapshot({ worldId: entry.worldId, href, entityId: entry.entityId, entityKind: entry.entityKind, title: entry.title, status: entry.status, visualSeed: entry.visualSeed, guidedStep: step as never });
    router.push(href);
  };

  const operatorPanel = <aside className={`rounded-2xl p-4 text-sm ${entry.panelClass}`} style={{ opacity: 0.84 + interaction.operatorGuidance.railNoiseSuppression * 0.1 + surface.presence.persistenceCue * 0.08, borderColor: `rgba(125,211,252,${0.18 + surface.ambient.operatorRailTone * 0.2})`, boxShadow: `0 0 ${8 + surface.continuity.continuityStrength * 20}px rgba(34,211,238,${0.09 + surface.ambient.continuityRailTone * 0.16})`, background: `linear-gradient(160deg, rgba(8,12,20,${0.56 + surface.ambient.ambientBlend * 0.12}), rgba(8,12,20,${0.44 + surface.presence.ambientSettling * 0.1}))` }}>
    <p>{flow?.question ?? prompt.question}</p>
    <p className="mt-2 text-xs text-cyan-100/80">{choreography.operatorCue.label} · {interaction.guidanceCue.label}</p>
    <p className="mt-1 text-xs text-white/60">{choreography.continuityCue.continuationLabel}</p>
    <p className="mt-2 text-xs text-white/60">Focus: {focusState.focusedPanelId ?? "workspace"} · Ambient: {ambientState.stabilized ? "stable" : "shifting"}</p>
    <div className="mt-2 grid gap-2 sm:grid-cols-2" data-attention={interaction.attention}>
      <button onClick={() => navigate(prompt.yes.href, prompt.yes.nextStep)} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: `rgba(110,231,183,${0.35 + interaction.guidanceCue.emphasis * 0.4})`, background: `rgba(52,211,153,${0.08 + interaction.guidanceCue.emphasis * 0.16})`, filter: `contrast(${1 + interaction.continuityAttention * 0.08})` }}>Yes</button>
      <button onClick={() => navigate(prompt.no.href, prompt.no.nextStep)} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: `rgba(253,230,138,${0.32 + interaction.panelRelationshipIntensity * 0.2})`, background: `rgba(251,191,36,${0.06 + (interaction.decisionFocus === "critical" ? 0.1 : 0.04)})` }}>No</button>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">{manualActions.map((action) => <Link key={action.id} href={action.href} className="rounded-full border border-white/20 px-3 py-1 text-xs">{action.label}</Link>)}</div>
    <div className="mt-4 flex gap-2"><Link href={persisted?.worldContinuity.environment.returnToDeckHref ?? "/shopreel"} onClick={() => persistRuntimeReturnState({ worldId: entry.worldId, scrollY: window.scrollY, restoreCardId: `${entry.entityKind ?? entry.worldKind}:${entry.entityId ?? entry.worldId}`, returnedAt: new Date().toISOString() })} className="rounded-lg border border-white/20 px-3 py-2 text-sm">Back to deck</Link><Link href={entry.manualSurfaceHref} className="rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-3 py-2 text-sm">Open full manual route</Link></div>
  </aside>;

  const inheritedAtmosphere = inheritedSeed.includes(":") ? inheritedSeed.split(":")[0] : entry.worldId;
  const cameraState = deriveRuntimeWorldCamera(resolvedTransition?.camera ?? "immersed", Boolean(resolvedTransition?.reducedMotion));

  return <div className={`relative min-h-screen text-white ${entry.transitionClass} ${transitionClass.container}`} data-world-seed={ambientState.visualSeed}>
    <div className={`pointer-events-none absolute inset-0 z-0 bg-gradient-to-br ${entry.tonalClass} ${inheritedAtmosphere === "campaign" ? "opacity-100" : "opacity-95"}`} style={{ opacity: 0.8 + immersion.atmosphere.ambientGlow * 0.14 }} />
    <div className={`pointer-events-none absolute inset-0 z-0 ${entry.orbClass} opacity-70`} />
    <div className={`pointer-events-none absolute inset-0 z-0 ${entry.gridClass} bg-[size:72px_72px] opacity-18`} />
    <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 md:px-6">
      <section className={`rounded-2xl p-4 ${entry.frameClass}`} style={{ opacity: resolvedTransition?.focus.shellOpacity ?? 1, transform: `translate3d(0,${cameraState.translateY}px,0) scale(${cameraState.scale})`, filter: `blur(${cameraState.blur}px)` }}>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">{entry.worldKind} world</p>
        <h1 className="text-2xl font-semibold">{entry.title}</h1>
        <p className="text-sm text-white/70">{entry.stageLabel} · {entry.status} · {entry.objective}</p>
      </section>
      <RuntimeWorldWorkspaceCanvas entry={entry} operatorPanel={operatorPanel} panelReveal={resolvedTransition?.focus.panelReveal ?? 1} continuityRailFocus={resolvedTransition?.focus.continuityRailFocus ?? 1} immersion={immersion} interaction={interaction} surface={surface} environment={environment}>{children}</RuntimeWorldWorkspaceCanvas>
    </div>
  </div>;
}
