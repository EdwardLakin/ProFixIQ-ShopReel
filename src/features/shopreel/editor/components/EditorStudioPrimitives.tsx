import type { ReactNode } from "react";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

type Tone = "default" | "muted" | "copper";

export function EditorWorkspaceFrame({
  topBar,
  mediaRail,
  stage,
  inspector,
  timeline,
}: {
  topBar: ReactNode;
  mediaRail: ReactNode;
  stage: ReactNode;
  inspector: ReactNode;
  timeline: ReactNode;
}) {
  return (
    <div className="relative space-y-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-8 top-8 h-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative z-10 space-y-4">
        {topBar}
        <div className="grid gap-4 2xl:grid-cols-[300px_minmax(0,1fr)_380px] xl:grid-cols-[260px_minmax(0,1fr)_340px]">
          {mediaRail}
          {stage}
          {inspector}
        </div>
        {timeline}
      </div>
    </div>
  );
}

export function ProductionTopBar({
  title,
  status,
  actions,
  pills,
}: {
  title: string;
  status: string;
  actions: ReactNode;
  pills: ReactNode;
}) {
  return (
    <section
      className={cx(
        "rounded-[2rem] border p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)]",
        glassTheme.border.softer,
        "bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_82%_10%,rgba(168,85,247,0.16),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cx("text-[11px] uppercase tracking-[0.24em]", glassTheme.text.muted)}>
            Production control room
          </p>
          <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">{title}</h2>
          <p className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
            {status} · Manual/operator controlled lifecycle.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {pills}
        <GlassBadge tone="muted">No autonomous posting</GlassBadge>
        <GlassBadge tone="default">Operator controlled</GlassBadge>
      </div>
    </section>
  );
}

export function CinematicPreviewStage({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cx(
        "min-w-0 overflow-hidden rounded-[2rem] border p-4 shadow-[0_30px_90px_rgba(0,0,0,0.4)]",
        glassTheme.border.softer,
        "bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.2),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(147,51,234,0.18),transparent_34%),linear-gradient(180deg,#050713,#02040a)]",
      )}
    >
      {title || subtitle ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h3 className="text-base font-semibold text-white">{title}</h3> : null}
            {subtitle ? <p className={cx("mt-1 text-xs", glassTheme.text.secondary)}>{subtitle}</p> : null}
          </div>
          <GlassBadge tone="default">Live workspace</GlassBadge>
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function PreviewCanvas({
  children,
  emptyLabel = "Preview stage",
}: {
  children?: ReactNode;
  emptyLabel?: string;
}) {
  return (
    <div className="relative grid min-h-[420px] place-items-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-x-10 top-10 h-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative z-10 w-full p-4">{children ?? <EditorEmptyStage label={emptyLabel} />}</div>
    </div>
  );
}

export function EditorEmptyStage({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
      <div className="mx-auto mb-4 h-24 w-24 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_40px_rgba(34,211,238,0.16)]" />
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="mt-2 text-xs text-white/55">Select a scene or asset to inspect the production frame.</p>
    </div>
  );
}

export function SourceMediaRail({ children }: { children: ReactNode }) {
  return <aside className="min-w-0 space-y-3 xl:sticky xl:top-4 xl:self-start">{children}</aside>;
}

export function InspectorRail({ children }: { children: ReactNode }) {
  return <aside className="min-w-0 space-y-3 xl:sticky xl:top-4 xl:self-start">{children}</aside>;
}

export function EditorPanelStack({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <section className={cx("rounded-3xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}>
      {eyebrow ? (
        <p className={cx("text-[10px] uppercase tracking-[0.22em]", glassTheme.text.muted)}>{eyebrow}</p>
      ) : null}
      <h3 className="mt-1 text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function SequenceTimeline({ children }: { children: ReactNode }) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-[2rem] border p-4 shadow-[0_22px_60px_rgba(0,0,0,0.32)]",
        glassTheme.border.softer,
        "bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.12),transparent_34%),linear-gradient(180deg,rgba(2,6,23,0.94),rgba(0,0,0,0.76))]",
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className={cx("text-xs uppercase tracking-[0.22em]", glassTheme.text.muted)}>
            Sequence timeline
          </div>
          <p className="mt-1 text-xs text-white/55">Hook → proof → payoff → CTA pacing.</p>
        </div>
        <GlassBadge tone="muted">Manual sequencing</GlassBadge>
      </div>
      {children}
    </section>
  );
}

export function SceneSequenceCard({ index, title, meta, active, children }: {
  index?: number;
  title?: string;
  meta?: string;
  active?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border p-3 transition",
        active ? "border-cyan-300/45 bg-cyan-300/[0.08] shadow-[0_0_28px_rgba(34,211,238,0.16)]" : cx(glassTheme.border.softer, glassTheme.glass.panelSoft),
      )}
    >
      <div className="flex items-start gap-3">
        {typeof index === "number" ? (
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-semibold text-white">
            {index + 1}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {title ? <p className="truncate text-sm font-medium text-white">{title}</p> : null}
          {meta ? <p className="mt-1 text-xs text-white/55">{meta}</p> : null}
          {children ? <div className="mt-2">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function RenderReadinessRail({ children }: { children: ReactNode }) {
  return (
    <div className={cx("rounded-2xl border p-3", glassTheme.border.softer, "bg-emerald-400/[0.05]")}>
      {children}
    </div>
  );
}

export function PlatformPreviewCard({ label, children, tone = "default" }: { label: string; children: ReactNode; tone?: Tone }) {
  return (
    <div className={cx("rounded-2xl border p-3", glassTheme.border.softer, glassTheme.glass.panelSoft)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className={cx("text-xs uppercase tracking-[0.2em]", glassTheme.text.muted)}>{label}</div>
        <GlassBadge tone={tone}>{tone === "copper" ? "Ready" : "Preview"}</GlassBadge>
      </div>
      {children}
    </div>
  );
}

export function EditorMetricTile({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-white/55">{detail}</p> : null}
    </div>
  );
}

export function EditorActionBar({ children }: { children: ReactNode }) {
  return (
    <div className={cx("flex flex-wrap gap-2 rounded-2xl border p-3", glassTheme.border.softer, "bg-white/[0.02]")}>
      {children}
    </div>
  );
}

/* Backward-compatible exports used by existing pages */
export const EditorWorkspaceShell = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">{children}</div>
);

export const MediaPreviewStage = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <CinematicPreviewStage title={title} subtitle={subtitle}>{children}</CinematicPreviewStage>
);

export const InspectorPanel = ({ title, children }: { title: string; children: ReactNode }) => (
  <EditorPanelStack title={title}>{children}</EditorPanelStack>
);

export const TimelineStrip = ({ children }: { children: ReactNode }) => (
  <div className={cx("mt-4 overflow-x-auto rounded-2xl border p-3", glassTheme.border.softer, "bg-black/30")}>{children}</div>
);

export const StoryboardGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
);

export const SceneCard = ({ title, chips = [], children }: { title: string; chips?: string[]; children: ReactNode }) => (
  <article className={cx("rounded-2xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}>
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <h5 className="text-sm font-semibold text-white">{title}</h5>
      <div className="flex flex-wrap gap-1">
        {chips.map((chip) => <GlassBadge key={chip} tone="muted">{chip}</GlassBadge>)}
      </div>
    </div>
    {children}
  </article>
);