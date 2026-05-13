"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type RuntimeWorldPanelAdapter = {
  panelId: string;
  route: string;
  title: string;
  embedMode: "full" | "embedded";
};

export function RuntimeRoutePanelAdapter({ adapter, children }: { adapter: RuntimeWorldPanelAdapter; children?: ReactNode }) {
  const hasContent = Boolean(children);
  return <section className="rounded-[1.1rem] border border-white/14 bg-[linear-gradient(175deg,rgba(11,20,36,.86),rgba(6,11,21,.94))] p-3 shadow-[0_16px_50px_rgba(0,0,0,.42)]">
    <header className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-sm font-medium text-white/90">{adapter.title}</h3>
      <Link href={adapter.route} className="rounded-md border border-white/20 px-2 py-1 text-[11px] text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Open manual route</Link>
    </header>
    {hasContent ? children : adapter.embedMode === "embedded" ? <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/70">No embedded panel content is available yet. Continue in the canonical route via <Link href={adapter.route} className="underline decoration-cyan-200/60 underline-offset-2">Open manual route</Link>.</div> : null}
  </section>;
}
