import type { ReactNode } from "react";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

export function EditorWorkspaceFrame({ topBar, mediaRail, stage, inspector, timeline }: { topBar: ReactNode; mediaRail: ReactNode; stage: ReactNode; inspector: ReactNode; timeline: ReactNode; }) {
  return <div className="space-y-4">{topBar}<div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">{mediaRail}{stage}{inspector}</div>{timeline}</div>;
}

export function ProductionTopBar({ title, status, actions, pills }: { title: string; status: string; actions: ReactNode; pills: ReactNode; }) {
  return <section className={cx("rounded-3xl border p-4", glassTheme.border.softer, "bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-black/90")}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className={cx("text-[11px] uppercase tracking-[0.2em]", glassTheme.text.muted)}>Production control room</p><h2 className="text-xl font-semibold text-white">{title}</h2><p className={cx("text-xs", glassTheme.text.secondary)}>{status} · Manual/operator controlled lifecycle.</p></div><div className="flex flex-wrap gap-2">{actions}</div></div><div className="mt-3 flex flex-wrap gap-2">{pills}<GlassBadge tone="muted">Operator controlled</GlassBadge></div></section>;
}

export function CinematicPreviewStage({ children }: { children: ReactNode }) { return <section className={cx("rounded-3xl border p-4", glassTheme.border.softer, "bg-gradient-to-b from-[#04060f] via-[#090b16] to-black")}>{children}</section>; }
export function SourceMediaRail({ children }: { children: ReactNode }) { return <aside className="space-y-3 min-w-0">{children}</aside>; }
export function InspectorRail({ children }: { children: ReactNode }) { return <aside className="space-y-3 min-w-0">{children}</aside>; }
export function SequenceTimeline({ children }: { children: ReactNode }) { return <section className={cx("rounded-3xl border p-4", glassTheme.border.softer, "bg-black/40")}><div className={cx("mb-3 text-xs uppercase tracking-[0.2em]", glassTheme.text.muted)}>Sequence timeline</div>{children}</section>; }
export function SceneSequenceCard({ children }: { children: ReactNode }) { return <div className={cx("rounded-2xl border p-3", glassTheme.border.softer, glassTheme.glass.panelSoft)}>{children}</div>; }
export function RenderReadinessRail({ children }: { children: ReactNode }) { return <div className={cx("rounded-2xl border p-3", glassTheme.border.softer, glassTheme.glass.panelSoft)}>{children}</div>; }
export function PlatformPreviewCard({ label, children }: { label: string; children: ReactNode }) { return <div className={cx("rounded-2xl border p-3", glassTheme.border.softer, glassTheme.glass.panelSoft)}><div className={cx("mb-2 text-xs uppercase tracking-[0.2em]", glassTheme.text.muted)}>{label}</div>{children}</div>; }

export const EditorWorkspaceShell = ({ children }: { children: ReactNode }) => <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">{children}</div>;
export const MediaPreviewStage = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => <section><div className="mb-2"><h3 className="text-base font-semibold text-white">{title}</h3><p className={cx("text-xs", glassTheme.text.secondary)}>{subtitle}</p></div>{children}</section>;
export const InspectorPanel = ({ title, children }: { title: string; children: ReactNode }) => <aside className={cx("space-y-3 rounded-3xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}><h4 className="text-sm font-semibold text-white">{title}</h4>{children}</aside>;
export const TimelineStrip = ({ children }: { children: ReactNode }) => <div className={cx("mt-4 overflow-x-auto rounded-2xl border p-3", glassTheme.border.softer, "bg-black/30")}>{children}</div>;
export const EditorActionBar = ({ children }: { children: ReactNode }) => <div className={cx("flex flex-wrap gap-2 rounded-2xl border p-3", glassTheme.border.softer, "bg-white/[0.02]")}>{children}</div>;
export const StoryboardGrid = ({ children }: { children: ReactNode }) => <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
export const SceneCard = ({ title, chips = [], children }: { title: string; chips?: string[]; children: ReactNode }) => <article className={cx("rounded-2xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h5 className="text-sm font-semibold text-white">{title}</h5><div className="flex flex-wrap gap-1">{chips.map((chip)=><GlassBadge key={chip} tone="muted">{chip}</GlassBadge>)}</div></div>{children}</article>;
