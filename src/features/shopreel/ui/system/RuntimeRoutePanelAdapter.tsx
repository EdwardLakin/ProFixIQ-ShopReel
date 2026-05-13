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
  return <section className="rounded-xl border border-white/10 bg-black/25 p-3">
    <header className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-sm font-medium text-white/90">{adapter.title}</h3>
      <Link href={adapter.route} className="rounded-md border border-white/20 px-2 py-1 text-[11px] text-white/80">Open full page</Link>
    </header>
    {hasContent ? children : adapter.embedMode === "embedded" ? <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/70">No embedded panel content is available for this route yet. Use <Link href={adapter.route} className="underline decoration-cyan-200/60 underline-offset-2">Open full page</Link> to continue in the canonical manual workspace.</div> : null}
  </section>;
}
