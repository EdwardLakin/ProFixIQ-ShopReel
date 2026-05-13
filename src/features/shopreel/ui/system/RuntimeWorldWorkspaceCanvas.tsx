"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { RUNTIME_WORLD_COMPOSITIONS } from "@/features/shopreel/ui/system/runtimeWorldComposition";
import { RuntimeRoutePanelAdapter } from "@/features/shopreel/ui/system/RuntimeRoutePanelAdapter";
import type { RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import { readPersistedRuntimeSession } from "@/features/shopreel/ui/system/runtimeSessionPersistence";

export default function RuntimeWorldWorkspaceCanvas({ entry, children, operatorPanel }: { entry: RuntimeWorldEntry; children: ReactNode; operatorPanel: ReactNode }) {
  const persisted = readPersistedRuntimeSession();
  const composition = RUNTIME_WORLD_COMPOSITIONS[entry.worldId] ?? { worldId: entry.worldId, panels: [] };
  const primary = composition.panels.find((panel) => panel.zone === "primary");
  const secondary = composition.panels.filter((panel) => panel.zone === "secondary");
  const bottom = composition.panels.filter((panel) => panel.zone === "bottom");
  const continuity = useMemo(() => ({
    previous: persisted?.previousWorldId ?? "none",
    current: entry.worldId,
    recommended: entry.worldId,
    unresolved: persisted?.worldContinuity.breadcrumbs.length ?? 0,
    lastAction: persisted?.worldContinuity.lastAction?.label ?? "none",
    guided: persisted?.worldContinuity.guidedStepId ?? "none",
  }), [entry.worldId, persisted]);

  return <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
    <div className="grid min-h-0 gap-4">
      <RuntimeRoutePanelAdapter adapter={{ panelId: primary?.id ?? "primary", route: primary?.route ?? entry.href, title: primary?.title ?? "Workspace", embedMode: "embedded" }}>{children}</RuntimeRoutePanelAdapter>
      <div className="grid gap-4 md:grid-cols-2">{secondary.map((panel) => <RuntimeRoutePanelAdapter key={panel.id} adapter={{ panelId: panel.id, route: panel.route, title: panel.title, embedMode: "embedded" }} />)}</div>
      <div className="grid gap-3 md:grid-cols-2">{bottom.map((panel) => <RuntimeRoutePanelAdapter key={panel.id} adapter={{ panelId: panel.id, route: panel.route, title: panel.title, embedMode: "embedded" }} />)}</div>
      <section className="rounded-xl border border-cyan-200/20 bg-cyan-300/5 px-3 py-2 text-xs text-cyan-100/90">Previous: {continuity.previous} · Current: {continuity.current} · Next: {continuity.recommended} · Unresolved: {continuity.unresolved} · Last action: {continuity.lastAction} · Guided: {continuity.guided}</section>
    </div>
    <aside>{operatorPanel}</aside>
  </section>;
}
