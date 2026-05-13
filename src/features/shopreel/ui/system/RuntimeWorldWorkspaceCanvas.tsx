"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { RuntimeRoutePanelAdapter } from "@/features/shopreel/ui/system/RuntimeRoutePanelAdapter";
import { RUNTIME_WORLD_COMPOSITIONS } from "@/features/shopreel/ui/system/runtimeWorldComposition";
import { deriveWorldChoreography } from "@/features/shopreel/ui/system/runtimeWorldChoreography";
import type { RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import { readPersistedRuntimeSession } from "@/features/shopreel/ui/system/runtimeSessionPersistence";
import { deriveRuntimeOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";
import type { RuntimeImmersionState } from "@/features/shopreel/ui/system/runtimeImmersion";
import type { RuntimeInteractionState } from "@/features/shopreel/ui/system/runtimeInteractionPolish";
import type { RuntimeSurfaceState } from "@/features/shopreel/ui/system/runtimeSurfaceCohesion";
import type { RuntimeEnvironment } from "@/features/shopreel/ui/system/runtimeEnvironment";

export default function RuntimeWorldWorkspaceCanvas({ entry, children, operatorPanel, panelReveal, continuityRailFocus, immersion, interaction, surface, environment }: { entry: RuntimeWorldEntry; children: ReactNode; operatorPanel: ReactNode; panelReveal: number; continuityRailFocus: number; immersion: RuntimeImmersionState; interaction: RuntimeInteractionState; surface: RuntimeSurfaceState; environment: RuntimeEnvironment }) {
  const persisted = readPersistedRuntimeSession();
  const composition = RUNTIME_WORLD_COMPOSITIONS[entry.worldId] ?? { worldId: entry.worldId, panels: [] };
  const choreography = useMemo(() => deriveWorldChoreography({
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
    transitionIntent: null,
  }), [composition, entry, persisted]);
  const primary = composition.panels.find((panel) => panel.id === choreography.panelPriority.primaryPanelId) ?? composition.panels.find((panel) => panel.zone === "primary");
  const secondary = choreography.panelPriority.secondaryPanelIds.map((id) => composition.panels.find((panel) => panel.id === id)).filter((panel): panel is (typeof composition.panels)[number] => Boolean(panel));
  const orchestration = useMemo(() => deriveRuntimeOrchestration({ worldId: entry.worldId, status: entry.status, blockers: entry.blockers, unresolvedCount: entry.unresolvedCount, guidedStepId: persisted?.worldContinuity.guidedStepId ?? null, previousWorldId: persisted?.previousWorldId ?? null, lastActionLabel: persisted?.worldContinuity.lastAction?.label ?? null, breadcrumbs: persisted?.worldContinuity.breadcrumbs ?? [], composition, choreography, now: new Date().toISOString(), lastTransitionAt: persisted?.updatedAt ?? null }), [choreography, composition, entry.blockers, entry.status, entry.unresolvedCount, entry.worldId, persisted]);

  return <section className="relative z-20 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" style={{ opacity: Math.max(0.95, panelReveal), filter: `contrast(${1 + surface.pressure.contrastPressure * 0.08})` }}>
    <div className="space-y-4">
      <section className="relative rounded-[1.05rem] border border-cyan-200/20 bg-slate-950/82 p-4 shadow-[0_22px_68px_rgba(0,0,0,.44)]" style={{ transform: immersion.reducedMotion ? "none" : "translate3d(0,-8px,64px) scale(1.01)", boxShadow: "0 30px 120px rgba(8,145,178,.2)" }}>
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/80">Foreground next action</p>
        <h2 className="mt-2 text-lg font-semibold text-white">{entry.primaryAction?.label ?? "Waiting for command"}</h2>
        <p className="mt-1 text-sm text-cyan-100/80">{entry.primaryAction ? "This is the most important next decision in this world." : "No blocking action detected. Continue manually or issue a command."}</p>
        {entry.primaryAction ? <a href={entry.primaryAction.href} className="mt-3 inline-flex rounded-lg border border-cyan-200/35 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Open action</a> : null}
        <p className="mt-2 text-[11px] text-cyan-100/70">Focal path · {environment.focalPath.directionalIntent} · pull {environment.gravity.focalPull.toFixed(2)}</p>
      </section>

      <div className="relative rounded-[1.2rem] border border-white/14 bg-slate-950/80 p-3 shadow-[0_16px_52px_rgba(0,0,0,.5)]" style={{ transform: immersion.reducedMotion ? "none" : `translate3d(${environment.navigationVector.axisX * 18}px,${environment.navigationVector.axisY * 16}px,${environment.navigationVector.depth * 72}px)` }}>
        <RuntimeRoutePanelAdapter adapter={{ panelId: primary?.id ?? "primary", route: primary?.route ?? entry.href, title: primary?.title ?? "Manual workspace", embedMode: "embedded" }}>{children}</RuntimeRoutePanelAdapter>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {secondary.map((panel, index) => <div key={panel.id} style={{ opacity: immersion.reveal.secondaryReveal[index] ?? 1, transform: immersion.reducedMotion ? "none" : "translate3d(0,6px,-6px) scale(.995)" }}><RuntimeRoutePanelAdapter adapter={{ panelId: panel.id, route: panel.route, title: panel.title, embedMode: "embedded" }} /></div>)}
      </div>

      <section className="rounded-xl border border-cyan-200/16 bg-cyan-300/5 px-3 py-2 text-xs text-cyan-100/90" style={{ opacity: immersion.reveal.continuityReveal, boxShadow: `0 0 ${8 + continuityRailFocus * 10}px rgba(34,211,238,.12)` }}>{entry.title} · Objective: {environment.focalPath.currentObjective} · Next: {interaction.actionPriority} · Flow: {orchestration.flowHealth} · Pressure: {orchestration.operationalPressure}</section>
    </div>

    <aside className="relative z-40">{operatorPanel}</aside>
  </section>;
}
