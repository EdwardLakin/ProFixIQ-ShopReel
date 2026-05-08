import Link from "next/link";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

type HeroAction = {
  label: string;
  href: string;
  primary?: boolean;
};

export function AIStatusPill(props: { label: string; tone?: "neutral" | "good" | "warn" }) {
  const tone = props.tone ?? "neutral";
  const toneClass = tone === "good" ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100" : tone === "warn" ? "border-amber-300/30 bg-amber-400/15 text-amber-100" : "border-cyan-300/25 bg-cyan-400/10 text-cyan-100";
  return <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.12em] uppercase", toneClass)}><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />{props.label}</span>;
}

export function ShopReelPageHero(props: { title: string; subtitle: string; actions: HeroAction[]; }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-violet-300/25 bg-[radial-gradient(circle_at_10%_0%,rgba(126,92,255,0.36),transparent_42%),radial-gradient(circle_at_96%_8%,rgba(53,194,255,0.28),transparent_40%),linear-gradient(160deg,rgba(6,10,26,0.96),rgba(7,11,25,0.88))] p-4 shadow-[0_24px_80px_rgba(10,12,28,0.5)] md:p-5">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <AIStatusPill label="AI Orchestration Live" />
      <h1 className="mt-2.5 text-2xl font-semibold tracking-tight text-white md:text-3xl">{props.title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-white/75 md:text-base">{props.subtitle}</p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {props.actions.map((action) => (
          <Link key={action.label} href={action.href} className={action.primary ? "rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(83,87,255,0.45)]" : "rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-white/85 hover:bg-white/[0.08]"}>
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ShopReelSurface(props: { title: string; description?: string; children: React.ReactNode; tier?: "primary" | "standard" | "quiet" }) {
  const tier = props.tier ?? "standard";
  return <section className={cx("group rounded-2xl border p-3.5 shadow-[0_16px_42px_rgba(6,8,22,0.34)] backdrop-blur-xl transition", tier === "primary" ? "border-violet-300/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))]" : tier === "quiet" ? "border-white/8 bg-white/[0.02]" : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]", "hover:border-white/20")}><h2 className="text-[15px] font-semibold tracking-tight text-white">{props.title}</h2>{props.description ? <p className="mt-0.5 text-sm text-white/68">{props.description}</p> : null}<div className="mt-2.5">{props.children}</div></section>;
}

export function ShopReelSectionHeader(props: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <header className="space-y-1.5">
      {props.eyebrow ? <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">{props.eyebrow}</p> : null}
      <h2 className="text-xl font-semibold tracking-tight text-white">{props.title}</h2>
      {props.subtitle ? <p className="text-sm text-white/70">{props.subtitle}</p> : null}
    </header>
  );
}

export function ShopReelEmptyState(props: { title: string; description: string; ctaLabel?: string; ctaHref?: string }) {
  return <div className={cx("rounded-2xl border p-5", glassTheme.border.softer, glassTheme.glass.panelSoft)}><AIStatusPill label="Need input" tone="warn" /><div className="mt-3 text-lg font-semibold text-white">{props.title}</div><p className="mt-1 text-sm text-white/75">{props.description}</p>{props.ctaLabel && props.ctaHref ? <Link href={props.ctaHref} className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-violet-500 to-cyan-400 px-3 py-2 text-sm font-medium text-white">{props.ctaLabel}</Link> : null}</div>;
}

export function ShopReelActionRail(props: { title: string; items: string[] }) {
  return <aside className="rounded-2xl border border-white/10 bg-white/[0.025] p-3.5"><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">{props.title}</h3><div className="mt-2.5 space-y-2">{props.items.map((item, index) => <div key={item} className="flex items-start gap-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2 text-sm text-white/80"><span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-[11px]">{index + 1}</span><span>{item}</span></div>)}</div></aside>;
}
