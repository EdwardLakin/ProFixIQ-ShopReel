"use client";

import type { ReactNode } from "react";
import { RuntimeRoutePanelAdapter } from "@/features/shopreel/ui/system/RuntimeRoutePanelAdapter";
import { RUNTIME_WORLD_COMPOSITIONS } from "@/features/shopreel/ui/system/runtimeWorldComposition";
import type { RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import type { RuntimeEmbodiedState } from "@/features/shopreel/ui/system/runtimeEmbodiment";

export type RuntimeWorldWorkspacePlanes = { foreground: ReactNode; midground: ReactNode; background: ReactNode; peripheral: ReactNode; distant: ReactNode };

export default function RuntimeWorldWorkspaceCanvas({ entry, children, embodied }: { entry: RuntimeWorldEntry; children: ReactNode; embodied: RuntimeEmbodiedState }): RuntimeWorldWorkspacePlanes {
  const composition = RUNTIME_WORLD_COMPOSITIONS[entry.worldId] ?? { worldId: entry.worldId, panels: [] };
  const primary = composition.panels.find((panel) => panel.zone === "primary") ?? composition.panels[0];
  const secondary = composition.panels.filter((panel) => panel.id !== primary?.id).slice(0, 2);

  return {
    foreground: <section className="bg-slate-950/62 p-4 shadow-[0_28px_90px_rgba(8,145,178,.24)] ring-1 ring-cyan-200/20" data-pressure={embodied.pressureResolution}><p className="text-[10px] uppercase tracking-[0.22em] text-cyan-100/70">Focal surface</p><h2 className="mt-2 text-lg font-semibold">{entry.primaryAction?.label ?? "No blocking action"}</h2><p className="mt-1 text-sm text-cyan-100/75">{entry.objective}</p>{entry.primaryAction ? <a href={entry.primaryAction.href} className="mt-3 inline-flex rounded-md bg-cyan-300/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Engage action surface</a> : null}</section>,
    midground: <section className="bg-slate-950/70 p-3 shadow-[0_24px_78px_rgba(2,6,23,.54)] ring-1 ring-white/10"><RuntimeRoutePanelAdapter adapter={{ panelId: primary?.id ?? "primary", route: primary?.route ?? entry.href, title: primary?.title ?? "Manual workspace", embedMode: "embedded" }}>{children}</RuntimeRoutePanelAdapter></section>,
    background: <section className="bg-slate-950/38 px-3 py-2 text-xs text-white/70 ring-1 ring-white/10">{entry.stageLabel} · {entry.status} · {entry.worldKind} chamber</section>,
    peripheral: <div className="grid gap-3 md:max-w-[28rem]" data-rhythm={embodied.operationalRhythm}>{secondary.map((panel) => <div key={panel.id} className="bg-slate-950/46 p-2 ring-1 ring-white/10"><RuntimeRoutePanelAdapter adapter={{ panelId: panel.id, route: panel.route, title: panel.title, embedMode: "embedded" }} /></div>)}</div>,
    distant: <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-white/65">Topology silhouette · {entry.worldId}</div>,
  };
}
