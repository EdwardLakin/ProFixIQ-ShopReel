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
  return <section className="rounded-xl border border-white/10 bg-black/25 p-3">
    <header className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-sm font-medium text-white/90">{adapter.title}</h3>
      <Link href={adapter.route} className="rounded-md border border-white/20 px-2 py-1 text-[11px] text-white/80">Open full page</Link>
    </header>
    {adapter.embedMode === "embedded" ? <div className="text-xs text-white/65">Embedded operational panel using canonical route context.</div> : null}
    {children}
  </section>;
}
