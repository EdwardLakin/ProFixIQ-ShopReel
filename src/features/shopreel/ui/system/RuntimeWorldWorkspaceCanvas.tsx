"use client";

import type { ReactNode } from "react";
import { RuntimeRoutePanelAdapter } from "@/features/shopreel/ui/system/RuntimeRoutePanelAdapter";
import { runtimeChamberPrimitives } from "@/features/shopreel/ui/system/runtimeChamberPrimitives";
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
    foreground: <section className={`${runtimeChamberPrimitives.focalActionPlane} ${isCampaignWorld ? "mx-auto w-full max-w-5xl" : ""}`} data-pressure={embodied.pressureResolution}>
      <div className="pointer-events-none absolute inset-x-[18%] bottom-0 h-10 rounded-full bg-cyan-400/20 blur-2xl" />
      <div className="pointer-events-none absolute inset-x-[10%] -bottom-5 h-14 rounded-[100%] border border-cyan-300/20 bg-cyan-400/10 blur-[2px]" />
      <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-100/75">Campaign command stage</p>
      <h2 className="mt-2 text-lg font-semibold">{entry.primaryAction?.label ?? "No blocking action"}</h2>
      <p className="mt-1 text-sm text-cyan-100/80">{entry.objective}</p>
      {entry.primaryAction ? <a href={entry.primaryAction.href} className="mt-4 inline-flex rounded-md bg-cyan-300/15 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Engage action surface</a> : null}
    </section>,
    midground: <section className={`${runtimeChamberPrimitives.recessedSystemPlane} mx-auto w-full ${isCampaignWorld ? "max-w-6xl" : ""}`}><RuntimeRoutePanelAdapter adapter={{ panelId: primary?.id ?? "primary", route: primary?.route ?? entry.href, title: primary?.title ?? "Manual workspace", embedMode: "embedded", surfaceTone: "native" }}>{children}</RuntimeRoutePanelAdapter></section>,
    background: <section className={`${runtimeChamberPrimitives.environmentalTelemetryNode} mx-auto w-full max-w-6xl`}>{entry.stageLabel} · {entry.status} · {entry.worldKind} chamber</section>,
    peripheral: <div className={`mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-2 ${runtimeChamberPrimitives.depthAttenuation}`} data-rhythm={embodied.operationalRhythm}>{secondary.map((panel, index) => <div key={panel.id} className={`${runtimeChamberPrimitives.recessedSystemPlane} ${index === 0 ? "md:translate-y-2" : "md:-translate-y-1"}`}><RuntimeRoutePanelAdapter adapter={{ panelId: panel.id, route: panel.route, title: panel.title, embedMode: "embedded", surfaceTone: "chamber" }} /></div>)}</div>,
    distant: <div className={`mx-auto w-full max-w-6xl text-center ${runtimeChamberPrimitives.distantTopologyMarker}`}>Topology marker · {entry.worldId} · {embodied.operationalRhythm}</div>,
  };
}
