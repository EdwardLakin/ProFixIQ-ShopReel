import Link from "next/link";
import type { ReactNode } from "react";

type HeroAction = {
  label: string;
  href: string;
  primary?: boolean;
};

export function ShopReelPageHero({
  title,
  subtitle,
  eyebrow = "Command center",
  actions = [],
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: HeroAction[];
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-400/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl sm:p-7">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_0%,rgba(139,92,246,.26),transparent_32%),radial-gradient(circle_at_100%_0%,rgba(34,211,238,.18),transparent_34%)]" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">{subtitle}</p> : null}
        </div>
        {actions.length ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className={
                  action.primary
                    ? "rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-300 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(99,102,241,.34)] transition hover:-translate-y-0.5"
                    : "rounded-2xl border border-slate-400/10 bg-white/[0.055] px-4 py-2.5 text-sm font-semibold text-white/80 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.09]"
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export function ShopReelSurface({
  title,
  description,
  children,
  actions,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative overflow-hidden rounded-[1.75rem] border border-slate-400/10 bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,.32)] backdrop-blur-2xl sm:p-5 ${className}`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/18 to-transparent" />
      {(title || description || actions) ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-lg font-semibold tracking-[-0.025em] text-white">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-white/58">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function ShopReelSectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200/70">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-[-0.035em] text-white">{title}</h2>
      {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">{subtitle}</p> : null}
    </div>
  );
}

export function ShopReelActionRail({
  title,
  items,
  children,
}: {
  title: string;
  items?: string[];
  children?: ReactNode;
}) {
  return (
    <aside className="relative overflow-hidden rounded-[1.75rem] border border-slate-400/10 bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,.34)] backdrop-blur-2xl sm:p-5">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,.14),transparent_30%)]" />
      <h3 className="text-base font-semibold tracking-[-0.02em] text-white">{title}</h3>
      {items?.length ? (
        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-400/10 bg-black/20 px-3 py-2.5 text-sm text-white/68">
              {item}
            </div>
          ))}
        </div>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </aside>
  );
}

export function ShopReelEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/16 bg-black/20 p-5 text-white/72">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-400/10 bg-white/[0.06] text-lg">
        ✦
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description ? <p className="mt-1 text-sm leading-6 text-white/56">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ShopReelMediaStage({
  title = "Media stage",
  description,
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative min-h-[22rem] overflow-hidden rounded-[2rem] border border-slate-400/10 bg-[#02040c]/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,.44)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_0%,rgba(124,58,237,.24),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(34,211,238,.13),transparent_30%)]" />
      <div className="relative z-10 flex h-full min-h-[20rem] flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-200/62">
              Preview
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-white">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm leading-6 text-white/52">{description}</p> : null}
          </div>
          <div className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
            Live
          </div>
        </div>
        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[1.35rem] border border-slate-400/10 bg-black/36">
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative z-10 w-full">{children ?? <div className="p-8 text-center text-sm text-white/48">Media preview appears here.</div>}</div>
        </div>
      </div>
    </section>
  );
}

export function ShopReelTimelineSurface({
  title = "Timeline",
  tracks = ["Hook", "Scene", "Caption", "Audio"],
}: {
  title?: string;
  tracks?: string[];
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-400/10 bg-white/[0.04] p-4 shadow-[0_18px_60px_rgba(0,0,0,.3)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-[-0.02em] text-white">{title}</h3>
        <span className="text-xs text-white/42">00:00 — 00:30</span>
      </div>
      <div className="space-y-2">
        {tracks.map((track, index) => (
          <div key={track} className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-3">
            <div className="text-xs font-medium text-white/46">{track}</div>
            <div className="h-10 rounded-xl border border-slate-400/10 bg-black/25 p-1">
              <div
                className="h-full rounded-lg bg-gradient-to-r from-violet-400/35 via-cyan-300/20 to-transparent"
                style={{ width: `${Math.max(28, 88 - index * 13)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
