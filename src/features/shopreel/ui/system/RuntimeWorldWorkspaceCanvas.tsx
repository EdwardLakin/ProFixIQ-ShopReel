"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { RuntimeRoutePanelAdapter } from "@/features/shopreel/ui/system/RuntimeRoutePanelAdapter";
import { RUNTIME_WORLD_COMPOSITIONS } from "@/features/shopreel/ui/system/runtimeWorldComposition";
import { deriveWorldChoreography } from "@/features/shopreel/ui/system/runtimeWorldChoreography";
import type { RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import { readPersistedRuntimeSession } from "@/features/shopreel/ui/system/runtimeSessionPersistence";
import { deriveRuntimeOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";
import { buildRuntimeEntityGraph } from "@/features/shopreel/ui/system/runtimeEntityGraph";
import { buildRuntimeTemporalMemory } from "@/features/shopreel/ui/system/runtimeTemporalMemory";
import type { RuntimeImmersionState } from "@/features/shopreel/ui/system/runtimeImmersion";

export default function RuntimeWorldWorkspaceCanvas({ entry, children, operatorPanel, panelReveal, continuityRailFocus, immersion }: { entry: RuntimeWorldEntry; children: ReactNode; operatorPanel: ReactNode; panelReveal: number; continuityRailFocus: number; immersion: RuntimeImmersionState }) {
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


  const entityGraph = useMemo(() => buildRuntimeEntityGraph({
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
  }), [composition, entry, persisted]);

  const continuity = useMemo(() => ({
    previous: persisted?.previousWorldId ?? "none",
    current: entry.worldId,
    recommended: entry.worldId,
    unresolved: persisted?.worldContinuity.breadcrumbs.length ?? 0,
    lastAction: persisted?.worldContinuity.lastAction?.label ?? "none",
    guided: persisted?.worldContinuity.guidedStepId ?? "none",
  }), [entry.worldId, persisted]);
  const temporalMemory = useMemo(() => buildRuntimeTemporalMemory({
    now: new Date().toISOString(),
    activeWorldId: entry.worldId,
    status: entry.status,
    unresolvedCount: entry.unresolvedCount,
    blockers: entry.blockers,
    breadcrumbs: persisted?.worldContinuity.breadcrumbs ?? [],
    transitionHistory: (persisted?.worldContinuity.breadcrumbs ?? []).map((item) => ({ from: null, to: item.worldId, at: item.at, reason: item.label })),
    orchestration,
    choreography,
    entityGraph,
  }), [choreography, entry.blockers, entry.status, entry.unresolvedCount, entry.worldId, entityGraph, orchestration, persisted?.worldContinuity.breadcrumbs]);

  const railClass = orchestration.operationalPressure === "critical" ? "xl:grid-cols-[minmax(0,1fr)_420px]" : "xl:grid-cols-[minmax(0,1fr)_360px]";
  const secondaryClass = orchestration.attentionState === "focused" ? "opacity-75" : "";
  const pressureRail = immersion.operationalIntensity === "critical" ? "xl:grid-cols-[minmax(0,1fr)_440px]" : railClass;

  return <section className={`grid gap-4 ${pressureRail}`} style={{ opacity: Math.max(0.82, panelReveal), filter: `contrast(${immersion.atmosphere.panelContrast})` }}>
    <div className="grid min-h-0 gap-4">
      <div style={{ opacity: immersion.reveal.primaryReveal, transform: immersion.reducedMotion ? "none" : `scale(${0.996 + immersion.reveal.primaryReveal * 0.004})`, filter: `blur(${immersion.reducedMotion ? 0 : (1 - immersion.reveal.primaryReveal) * 2}px)` }}><RuntimeRoutePanelAdapter adapter={{ panelId: primary?.id ?? "primary", route: primary?.route ?? entry.href, title: primary?.title ?? "Workspace", embedMode: "embedded" }}>{children}</RuntimeRoutePanelAdapter></div>
      <div className={`grid gap-4 md:grid-cols-2 ${secondaryClass}`}>{secondary.map((panel, index) => <div key={panel.id} className={choreography.panelPriority.collapsedPanelIds.includes(panel.id) ? "opacity-85" : ""} style={{ opacity: immersion.reveal.secondaryReveal[index] ?? immersion.reveal.secondaryReveal.at(-1) ?? 1, filter: `blur(${immersion.reducedMotion ? 0 : (1 - (immersion.reveal.secondaryReveal[index] ?? 1)) * 1.25}px)` }}><RuntimeRoutePanelAdapter adapter={{ panelId: panel.id, route: panel.route, title: panel.title, embedMode: "embedded" }} /></div>)}</div>
      <div className="grid gap-3 md:grid-cols-2">{bottom.map((panel) => <RuntimeRoutePanelAdapter key={panel.id} adapter={{ panelId: panel.id, route: panel.route, title: panel.title, embedMode: "embedded" }} />)}</div>
      <section className="rounded-xl border border-cyan-200/20 bg-cyan-300/5 px-3 py-2 text-xs text-cyan-100/90" style={{ opacity: immersion.reveal.continuityReveal, boxShadow: `0 0 ${12 + continuityRailFocus * 22 + immersion.atmosphere.continuityGlow * 18}px rgba(34,211,238,.22)` }}>{choreography.operatorCue.label} · {choreography.continuityCue.label} · Previous: {continuity.previous} · Current: {continuity.current} · Next: {continuity.recommended} · Unresolved: {continuity.unresolved} · Last action: {continuity.lastAction} · Guided: {continuity.guided} · Flow: {orchestration.flowHealth} · Pressure: {orchestration.operationalPressure} · Arrived from: {entityGraph.contextChain.arrivedFrom ?? "deck"}</section>
      <section className="rounded-xl border border-violet-200/20 bg-violet-300/5 px-3 py-2 text-xs text-violet-100/90">Timeline · Prev {continuity.previous} → Current {continuity.current} · Recovery: {orchestration.recoveryState.cue ?? "none"} · Dormant: {orchestration.dormancyState.isDormant ? orchestration.dormancyState.cue : "no"} · Interrupted: {orchestration.escalationState.needsEscalation ? "yes" : "no"} · Upstream: {entityGraph.traversal.upstream.join(" → ") || "none"} · Downstream: {entityGraph.traversal.downstream.join(" → ") || "none"}</section>
      <section className="rounded-xl border border-amber-200/20 bg-amber-300/5 px-3 py-2 text-xs text-amber-100/90">Temporal continuity · Age: {temporalMemory.window.ageMinutes}m · Volatility: {temporalMemory.volatility} · Resilience: {temporalMemory.resilience} · Decay: {temporalMemory.decayState} · Interruptions: {temporalMemory.interruptions.length} · Recoveries: {temporalMemory.recoveries.length} · Last stable point: {temporalMemory.checkpoints.at(-1)?.label ?? "none"} · Resume interrupted flow: {temporalMemory.interruptions.length > 0 ? "recommended" : "not needed"}</section>
      <section className="rounded-xl border border-rose-200/20 bg-rose-300/5 px-3 py-2 text-xs text-rose-100/90">Dependency chain: {entityGraph.dependencies.map((dep) => `${dep.sourceId} → ${dep.targetId}`).join(" · ") || "none"} · Blockers: {entityGraph.traversal.blockers.map((b) => `${b.reason} (${b.priority})`).join(" · ") || "none"}</section>
      <section className="rounded-xl border border-emerald-200/20 bg-emerald-300/5 px-3 py-2 text-xs text-emerald-100/90" style={{ opacity: immersion.reveal.lineageReveal }}>Lineage: {entityGraph.lineage.chain.join(" → ") || "none"} · Previous hop: {entityGraph.traversal.lastRelationshipHop ?? "none"}</section>
    </div>
    <aside style={{ opacity: 0.85 + immersion.focusCue.blockerProximityEmphasis * 0.15 }}>{operatorPanel}</aside>
  </section>;
}
