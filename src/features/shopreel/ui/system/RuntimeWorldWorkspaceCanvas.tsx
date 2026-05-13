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
  const isCampaignWorld = entry.worldId === "campaign";

  return {
    foreground: <section className={`relative overflow-hidden rounded-[1.8rem] border border-cyan-200/15 bg-[radial-gradient(120%_130%_at_50%_0%,rgba(34,211,238,.20),rgba(4,11,24,.78)_48%,rgba(3,7,18,.96)_100%)] p-5 shadow-[0_42px_120px_rgba(2,132,199,.30)] ${isCampaignWorld ? "mx-auto w-full max-w-5xl" : ""}`} data-pressure={embodied.pressureResolution}>
      <div className="pointer-events-none absolute inset-x-[18%] bottom-0 h-10 rounded-full bg-cyan-400/20 blur-2xl" />
      <div className="pointer-events-none absolute inset-x-[10%] -bottom-5 h-14 rounded-[100%] border border-cyan-300/20 bg-cyan-400/10 blur-[2px]" />
      <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-100/75">Campaign command stage</p>
      <h2 className="mt-2 text-lg font-semibold">{entry.primaryAction?.label ?? "No blocking action"}</h2>
      <p className="mt-1 text-sm text-cyan-100/80">{entry.objective}</p>
      {entry.primaryAction ? <a href={entry.primaryAction.href} className="mt-4 inline-flex rounded-md bg-cyan-300/15 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Engage action surface</a> : null}
    </section>,
    midground: <section className={`mx-auto w-full overflow-hidden rounded-[1.65rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,16,30,.88),rgba(3,8,20,.92))] p-3 shadow-[0_36px_96px_rgba(2,6,23,.58)] ${isCampaignWorld ? "max-w-6xl" : ""}`}><RuntimeRoutePanelAdapter adapter={{ panelId: primary?.id ?? "primary", route: primary?.route ?? entry.href, title: primary?.title ?? "Manual workspace", embedMode: "embedded", surfaceTone: isCampaignWorld ? "chamber" : "panel" }}>{children}</RuntimeRoutePanelAdapter></section>,
    background: <section className="mx-auto w-full max-w-6xl rounded-[1.2rem] border border-white/10 bg-[linear-gradient(105deg,rgba(148,163,184,.08),rgba(15,23,42,.30))] px-4 py-3 text-xs text-white/75">{entry.stageLabel} · {entry.status} · {entry.worldKind} chamber</section>,
    peripheral: <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-2" data-rhythm={embodied.operationalRhythm}>{secondary.map((panel, index) => <div key={panel.id} className={`relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[linear-gradient(170deg,rgba(9,16,31,.62),rgba(5,10,22,.84))] p-2 shadow-[0_22px_72px_rgba(2,6,23,.42)] ${index === 0 ? "md:translate-y-3" : "md:-translate-y-2"}`}><div className="pointer-events-none absolute inset-x-[18%] -bottom-3 h-8 rounded-full bg-cyan-300/15 blur-xl" /><RuntimeRoutePanelAdapter adapter={{ panelId: panel.id, route: panel.route, title: panel.title, embedMode: "embedded", surfaceTone: "chamber" }} /></div>)}</div>,
    distant: <div className="mx-auto w-full max-w-6xl rounded-[999px] border border-white/10 bg-slate-950/30 px-4 py-2 text-center text-xs text-white/60">Runtime HUD · {entry.worldId} · {embodied.operationalRhythm}</div>,
  };
}
