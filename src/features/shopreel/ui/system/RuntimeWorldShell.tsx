"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { RuntimeWorldEntry, RuntimeWorldAction } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import type { GuidedFlowStepId } from "@/features/shopreel/ui/system/guidedWorldFlow";
import { resolveGuidedFlowStep } from "@/features/shopreel/ui/system/guidedWorldFlow";
import { RUNTIME_WORLD_MAP } from "@/features/shopreel/ui/system/runtimeWorldMap";

const FLOW_BY_WORLD: Partial<Record<RuntimeWorldEntry["worldId"], GuidedFlowStepId>> = {
  campaign: "select_output_type",
  upload: "asset_readiness",
  generation: "idea_script_readiness",
  review: "output_acceptable",
  render: "render_complete",
  publish: "publish_timing",
  analytics: "analyze_or_defer",
};

function actionForWorld(worldId: RuntimeWorldEntry["worldId"]): RuntimeWorldAction[] {
  const def = RUNTIME_WORLD_MAP[worldId];
  const base = def.primaryActions.map((item) => ({ id: item.id, label: item.label, href: item.href ?? def.canonicalRoute }));
  const extras: RuntimeWorldAction[] = worldId === "publish"
    ? [{ id: "open_publish_queue", label: "Open publish queue", href: "/shopreel/publish-queue" }]
    : worldId === "render"
      ? [{ id: "open_render_jobs", label: "Open render jobs", href: "/shopreel/render-jobs" }]
      : worldId === "campaign"
        ? [{ id: "open_campaigns", label: "Review campaigns", href: "/shopreel/campaigns" }]
        : [];
  return [...base, ...extras];
}

export default function RuntimeWorldShell({ entry, children }: { entry: RuntimeWorldEntry; children: ReactNode }) {
  const flowId = FLOW_BY_WORLD[entry.worldId] ?? null;
  const flow = flowId ? resolveGuidedFlowStep(flowId) : null;
  const yesWorld = flow ? RUNTIME_WORLD_MAP[flow.yesTargetWorld] : null;
  const noWorld = flow ? RUNTIME_WORLD_MAP[flow.noTargetWorld] : null;
  const manualActions = actionForWorld(entry.worldId);

  return (
    <div className={`relative min-h-screen text-white ${entry.transitionClass}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${entry.tonalClass}`} />
      <div className={`pointer-events-none absolute inset-0 ${entry.orbClass}`} />
      <div className={`pointer-events-none absolute inset-0 ${entry.gridClass} bg-[size:72px_72px] opacity-35`} />
      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 md:px-6">
        <section className={`rounded-2xl p-4 ${entry.frameClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">{entry.worldKind} world · {entry.mood}</p>
              <h1 className="text-2xl font-semibold">{entry.title}</h1>
              <p className="text-sm text-white/70">{entry.stageLabel} · {entry.status}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/shopreel" className="rounded-lg border border-white/20 px-3 py-2 text-sm">Return to Operator deck</Link>
              <Link href={entry.href} className="rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-3 py-2 text-sm">Open active route</Link>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
            <div>Objective: <span className="text-white/70">{entry.objective}</span></div>
            <div>Atmosphere: <span className="text-white/70">{entry.atmosphereLabel}</span></div>
            <div>Status: <span className="text-white/70">{entry.status}</span></div>
            <div>Blockers: <span className="text-white/70">{entry.unresolvedCount}</span></div>
          </div>
        </section>

        <section className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className={`min-h-0 rounded-2xl p-3 ${entry.panelClass}`}>{children}</div>
          <aside className={`rounded-2xl p-4 text-sm ${entry.panelClass}`}>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Next best action</p>
            <p className="mt-2">{entry.nextWorldRecommendation?.summary ?? "Open manual workspace to continue."}</p>

            {flow ? (
              <div className="mt-5 space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Guided yes / no</p>
                <p>{flow.question}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href={yesWorld?.canonicalRoute ?? entry.manualSurfaceHref} className="rounded-lg border border-emerald-200/40 bg-emerald-400/10 px-3 py-2 text-center text-xs">Yes → {yesWorld?.shortLabel ?? "Open manual workspace"}</Link>
                  <Link href={noWorld?.canonicalRoute ?? entry.manualSurfaceHref} className="rounded-lg border border-amber-200/40 bg-amber-400/10 px-3 py-2 text-center text-xs">No → {noWorld?.shortLabel ?? "Open manual workspace"}</Link>
                </div>
                <p className="text-xs text-white/65">{flow.recommendedAction}</p>
              </div>
            ) : null}

            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Manual tools</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {manualActions.length > 0 ? manualActions.map((action) => (
                  <Link key={action.id} href={action.href} className="rounded-full border border-white/20 px-3 py-1 text-xs">{action.label}</Link>
                )) : <Link href={entry.manualSurfaceHref} className="rounded-full border border-white/20 px-3 py-1 text-xs">Open manual workspace</Link>}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
