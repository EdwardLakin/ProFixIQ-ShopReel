"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTransitionRouter } from "@/features/shopreel/ui/system/TransitionProvider";
import { persistRuntimeReturnState, readRuntimeSpatialTransition } from "@/features/shopreel/ui/system/runtimeSpatialTransition";
import RuntimeWorldWorkspaceCanvas from "@/features/shopreel/ui/system/RuntimeWorldWorkspaceCanvas";
import { resolveGuidedFlowStep, resolveWorldGuidedPrompt } from "@/features/shopreel/ui/system/guidedWorldFlow";
import type { RuntimeWorldAction, RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import { RUNTIME_WORLD_MAP } from "@/features/shopreel/ui/system/runtimeWorldMap";
import { createWorldEntryTransition, deriveWorldTransitionClasses, type RuntimeWorldAmbientState, type RuntimeWorldFocusState, type RuntimeWorldIdentityTransition } from "@/features/shopreel/ui/system/runtimeWorldTransition";
import { deriveWorldChoreography } from "@/features/shopreel/ui/system/runtimeWorldChoreography";
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

  useEffect(() => {
    if (!activeTransition || activeTransition.phase !== "arrived") return;
    if (activeTransition.reducedMotion) {
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
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
      window.cancelAnimationFrame(rafC);
    };
  }, [activeTransition, advanceWorldEntryCamera, completeWorldEntryTransition]);
  const choreography = deriveWorldChoreography({
    worldId: entry.worldId,
    status: entry.status,
    blockers: entry.blockers,
    unresolvedCount: entry.unresolvedCount,
    guidedStepId: persisted?.worldContinuity.guidedStepId ?? null,
    previousWorldId: persisted?.previousWorldId ?? null,
    lastActionLabel: persisted?.worldContinuity.lastAction?.label ?? null,
    breadcrumbs: persisted?.worldContinuity.breadcrumbs ?? [],
    composition: { worldId: entry.worldId, panels: [] },
    availableActions: entry.primaryAction ? [entry.primaryAction, ...entry.secondaryActions] : entry.secondaryActions,
    transitionIntent: { mode: "resume_world", fromWorldId: persisted?.previousWorldId ?? null, toWorldId: entry.worldId, fromRoute: persisted?.worldContinuity.previousRoute ?? null, toRoute: persisted?.worldContinuity.activeRoute ?? entry.href, label: "resume", at: new Date().toISOString() },
  });

  const navigate = (href: string, step: string | null) => {
    persistWorldEntrySnapshot({ worldId: entry.worldId, href, entityId: entry.entityId, entityKind: entry.entityKind, title: entry.title, status: entry.status, visualSeed: entry.visualSeed, guidedStep: step as never });
    router.push(href);
  };

  const operatorPanel = <aside className={`rounded-2xl p-4 text-sm ${entry.panelClass}`}>
    <p>{flow?.question ?? prompt.question}</p>
    <p className="mt-2 text-xs text-cyan-100/80">{choreography.operatorCue.label}</p>
    <p className="mt-1 text-xs text-white/60">{choreography.continuityCue.continuationLabel}</p>
    <p className="mt-2 text-xs text-white/60">Focus: {focusState.focusedPanelId ?? "workspace"} · Ambient: {ambientState.stabilized ? "stable" : "shifting"}</p>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      <button onClick={() => navigate(prompt.yes.href, prompt.yes.nextStep)} className="rounded-lg border border-emerald-200/40 bg-emerald-400/10 px-3 py-2 text-xs">Yes</button>
      <button onClick={() => navigate(prompt.no.href, prompt.no.nextStep)} className="rounded-lg border border-amber-200/40 bg-amber-400/10 px-3 py-2 text-xs">No</button>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">{manualActions.map((action) => <Link key={action.id} href={action.href} className="rounded-full border border-white/20 px-3 py-1 text-xs">{action.label}</Link>)}</div>
    <div className="mt-4 flex gap-2"><Link href={persisted?.worldContinuity.environment.returnToDeckHref ?? "/shopreel"} onClick={() => persistRuntimeReturnState({ worldId: entry.worldId, scrollY: window.scrollY, restoreCardId: `${entry.entityKind ?? entry.worldKind}:${entry.entityId ?? entry.worldId}`, returnedAt: new Date().toISOString() })} className="rounded-lg border border-white/20 px-3 py-2 text-sm">Back to deck</Link><Link href={entry.manualSurfaceHref} className="rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-3 py-2 text-sm">Open full manual route</Link></div>
  </aside>;

  const inheritedAtmosphere = inheritedSeed.includes(":") ? inheritedSeed.split(":")[0] : entry.worldId;

  return <div className={`relative min-h-screen text-white ${entry.transitionClass} ${transitionClass.container}`} data-world-seed={ambientState.visualSeed}>
    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${entry.tonalClass} ${inheritedAtmosphere === "campaign" ? "opacity-100" : "opacity-95"}`} />
    <div className={`pointer-events-none absolute inset-0 ${entry.orbClass}`} />
    <div className={`pointer-events-none absolute inset-0 ${entry.gridClass} bg-[size:72px_72px] opacity-35`} />
    <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 md:px-6">
      <section className={`rounded-2xl p-4 ${entry.frameClass}`} style={{ opacity: activeTransition?.focus.shellOpacity ?? 1, transform: activeTransition?.reducedMotion ? "none" : `scale(${activeTransition?.camera === "focusing" ? 0.992 : 1})`, filter: `blur(${activeTransition?.camera === "entering" ? 1.5 : 0}px)` }}>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">{entry.worldKind} world</p>
        <h1 className="text-2xl font-semibold">{entry.title}</h1>
        <p className="text-sm text-white/70">{entry.stageLabel} · {entry.status} · {entry.objective}</p>
      </section>
      <RuntimeWorldWorkspaceCanvas entry={entry} operatorPanel={operatorPanel} panelReveal={activeTransition?.focus.panelReveal ?? 1} continuityRailFocus={activeTransition?.focus.continuityRailFocus ?? 1}>{children}</RuntimeWorldWorkspaceCanvas>
    </div>
  </div>;
}
