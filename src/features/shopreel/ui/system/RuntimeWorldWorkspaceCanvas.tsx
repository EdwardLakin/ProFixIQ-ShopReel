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

export default function RuntimeWorldWorkspaceCanvas({ entry, children, operatorPanel, panelReveal, continuityRailFocus, immersion, interaction, surface }: { entry: RuntimeWorldEntry; children: ReactNode; operatorPanel: ReactNode; panelReveal: number; continuityRailFocus: number; immersion: RuntimeImmersionState; interaction: RuntimeInteractionState; surface: RuntimeSurfaceState }) {
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

  return <section className="relative z-20 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" style={{ opacity: Math.max(0.95, panelReveal), filter: `contrast(${1 + surface.pressure.contrastPressure * 0.08})` }}>
    <div className="[perspective:1800px] space-y-5">
      <section className="relative rounded-[1.2rem] border border-cyan-200/25 bg-[linear-gradient(150deg,rgba(20,35,56,.92),rgba(8,14,28,.95))] p-4 shadow-[0_34px_110px_rgba(0,0,0,.48)]" style={{ transform: immersion.reducedMotion ? "none" : "translate3d(0,-8px,64px) scale(1.01)", boxShadow: "0 30px 120px rgba(8,145,178,.2)" }}>
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/80">Foreground next action</p>
        <h2 className="mt-2 text-lg font-semibold text-white">{entry.primaryAction?.label ?? "Waiting for command"}</h2>
        <p className="mt-1 text-sm text-cyan-100/80">{entry.primaryAction ? "This is the most important next decision in this world." : "No blocking action detected. Continue manually or issue a command."}</p>
        {entry.primaryAction ? <a href={entry.primaryAction.href} className="mt-3 inline-flex rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-3 py-2 text-sm text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Open action</a> : null}
      </section>

      <div className="relative rounded-[1.5rem] border border-white/16 bg-[linear-gradient(180deg,rgba(7,14,27,.92),rgba(4,8,18,.95))] p-3 shadow-[0_24px_80px_rgba(0,0,0,.52)]" style={{ transform: immersion.reducedMotion ? "none" : "translate3d(0,0,22px)" }}>
        <RuntimeRoutePanelAdapter adapter={{ panelId: primary?.id ?? "primary", route: primary?.route ?? entry.href, title: primary?.title ?? "Manual workspace", embedMode: "embedded" }}>{children}</RuntimeRoutePanelAdapter>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {secondary.map((panel, index) => <div key={panel.id} style={{ opacity: immersion.reveal.secondaryReveal[index] ?? 1, transform: immersion.reducedMotion ? "none" : "translate3d(0,8px,-10px) scale(.99)" }}><RuntimeRoutePanelAdapter adapter={{ panelId: panel.id, route: panel.route, title: panel.title, embedMode: "embedded" }} /></div>)}
      </div>

      <section className="rounded-xl border border-cyan-200/20 bg-cyan-300/5 px-3 py-2 text-xs text-cyan-100/90" style={{ opacity: immersion.reveal.continuityReveal, boxShadow: `0 0 ${10 + continuityRailFocus * 14}px rgba(34,211,238,.16)` }}>{entry.title} · Objective: {entry.objective} · Next: {interaction.actionPriority} · Flow: {orchestration.flowHealth} · Pressure: {orchestration.operationalPressure}</section>
    </div>

    <aside className="relative z-40">{operatorPanel}</aside>
  </section>;
}
