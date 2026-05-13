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
  const secondary = choreography.panelPriority.secondaryPanelIds
    .map((id) => composition.panels.find((panel) => panel.id === id))
    .filter((panel): panel is (typeof composition.panels)[number] => Boolean(panel))
    .filter((panel) => panel.zone === "secondary");
  const bottom = composition.panels.filter((panel) => panel.zone === "bottom");
  const orchestration = useMemo(() => deriveRuntimeOrchestration({
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
    now: new Date().toISOString(),
    lastTransitionAt: persisted?.updatedAt ?? null,
  }), [choreography, composition, entry.blockers, entry.status, entry.unresolvedCount, entry.worldId, persisted]);


  const railClass = orchestration.operationalPressure === "critical" ? "xl:grid-cols-[minmax(0,1fr)_420px]" : "xl:grid-cols-[minmax(0,1fr)_360px]";
  const secondaryClass = orchestration.attentionState === "focused" ? "opacity-75" : "";
  const pressureRail = immersion.operationalIntensity === "critical" ? "xl:grid-cols-[minmax(0,1fr)_440px]" : railClass;

  return <section className={`relative z-20 grid gap-4 ${pressureRail}`} style={{ opacity: Math.max(0.92, panelReveal), filter: `contrast(${1 + surface.pressure.contrastPressure * 0.08})` }}>
    <div className="grid min-h-0 gap-4">
      <div style={{ opacity: immersion.reveal.primaryReveal, transform: immersion.reducedMotion ? "none" : `scale(${0.998 + immersion.reveal.primaryReveal * 0.002})`, filter: `blur(${immersion.reducedMotion ? 0 : (1 - immersion.reveal.primaryReveal) * 0.8}px)` }}><RuntimeRoutePanelAdapter adapter={{ panelId: primary?.id ?? "primary", route: primary?.route ?? entry.href, title: primary?.title ?? "Workspace", embedMode: "embedded" }}>{children}</RuntimeRoutePanelAdapter></div>
      <div className={`grid gap-4 md:grid-cols-2 ${secondaryClass}`}>{secondary.map((panel, index) => <div key={panel.id} className={choreography.panelPriority.collapsedPanelIds.includes(panel.id) ? "opacity-90" : ""} style={{ opacity: immersion.reveal.secondaryReveal[index] ?? immersion.reveal.secondaryReveal.at(-1) ?? 1 }}><RuntimeRoutePanelAdapter adapter={{ panelId: panel.id, route: panel.route, title: panel.title, embedMode: "embedded" }} /></div>)}</div>
      <div className="grid gap-3 md:grid-cols-2">{bottom.map((panel) => <RuntimeRoutePanelAdapter key={panel.id} adapter={{ panelId: panel.id, route: panel.route, title: panel.title, embedMode: "embedded" }} />)}</div>
      <section className="rounded-xl border border-cyan-200/20 bg-cyan-300/5 px-3 py-2 text-xs text-cyan-100/90" style={{ opacity: immersion.reveal.continuityReveal, boxShadow: `0 0 ${10 + continuityRailFocus * 14}px rgba(34,211,238,.16)` }}>{entry.title} · Objective: {entry.objective} · Next: {interaction.actionPriority} · Flow: {orchestration.flowHealth} · Pressure: {orchestration.operationalPressure}</section>
    </div>
    <aside style={{ opacity: 0.9 }}>{operatorPanel}</aside>
  </section>;

}
