"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import { resolveGuidedFlowStep } from "@/features/shopreel/ui/system/guidedWorldFlow";

export default function RuntimeWorldShell({ entry, children }: { entry: RuntimeWorldEntry; children: ReactNode }) {
  const flow = resolveGuidedFlowStep("asset_readiness");
  return (
    <div className="relative min-h-screen text-white">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${entry.backgroundTone}`} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,.08),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,.06),transparent_28%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 md:px-6">
        <section className="rounded-2xl border border-white/15 bg-black/25 p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">{entry.worldKind} world</p>
              <h1 className="text-2xl font-semibold">{entry.title}</h1>
              <p className="text-sm text-white/70">{entry.stageLabel} · {entry.status}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/shopreel" className="rounded-lg border border-white/20 px-3 py-2 text-sm">Back to Operator</Link>
              <Link href={entry.href} className="rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-3 py-2 text-sm">Continue with Operator</Link>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
            <div>Objective: <span className="text-white/70">{entry.actionLabel}</span></div>
            <div>Atmosphere: <span className="text-white/70">{entry.atmosphereLabel}</span></div>
            <div>Blockers: <span className="text-white/70">{entry.unresolvedCount || 0}</span></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {entry.primaryAction ? <Link href={entry.primaryAction.href} className="rounded-full border border-emerald-200/40 px-3 py-1">{entry.primaryAction.label}</Link> : null}
            <Link href={entry.manualSurfaceHref} className="rounded-full border border-white/20 px-3 py-1">Manual tools link</Link>
          </div>
        </section>

        <section className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 rounded-2xl border border-white/10 bg-black/20 p-3">{children}</div>
          <aside className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Next best action</p>
            <p className="mt-2">{entry.nextWorldRecommendation?.summary ?? "No recommendation yet."}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-100/80">Guided prompt</p>
            <p className="mt-2">{flow.question}</p>
            <p className="mt-2 text-white/70">{flow.recommendedAction}</p>
          </aside>
        </section>
      </div>
    </div>
  );
}
