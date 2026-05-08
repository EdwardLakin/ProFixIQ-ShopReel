import type { ReactNode } from "react";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

export function EditorWorkspaceShell({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">{children}</div>;
}

export function MediaPreviewStage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className={cx("rounded-3xl border p-4 sm:p-5", glassTheme.border.softer, "bg-gradient-to-b from-[#0b1020]/95 via-black/90 to-[#06080f]/95")}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className={cx("text-xs", glassTheme.text.secondary)}>{subtitle}</p>
        </div>
        <GlassBadge tone="default">Operator controlled</GlassBadge>
      </div>
      {children}
    </section>
  );
}

export function InspectorPanel({ title, children }: { title: string; children: ReactNode }) {
  return <aside className={cx("space-y-3 rounded-3xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}><h4 className="text-sm font-semibold text-white">{title}</h4>{children}</aside>;
}

export function TimelineStrip({ children }: { children: ReactNode }) {
  return <div className={cx("mt-4 overflow-x-auto rounded-2xl border p-3", glassTheme.border.softer, "bg-black/30")}>{children}</div>;
}

export function EditorActionBar({ children }: { children: ReactNode }) {
  return <div className={cx("flex flex-wrap gap-2 rounded-2xl border p-3", glassTheme.border.softer, "bg-white/[0.02]")}>{children}</div>;
}

export function StoryboardGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function SceneCard({ title, chips = [], children }: { title: string; chips?: string[]; children: ReactNode }) {
  return <article className={cx("rounded-2xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h5 className="text-sm font-semibold text-white">{title}</h5><div className="flex flex-wrap gap-1">{chips.map((chip)=> <GlassBadge key={chip} tone="muted">{chip}</GlassBadge>)}</div></div>{children}</article>;
}
