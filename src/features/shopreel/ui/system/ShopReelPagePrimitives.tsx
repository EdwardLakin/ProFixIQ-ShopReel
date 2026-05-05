import Link from "next/link";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

type HeroAction = {
  label: string;
  href: string;
  primary?: boolean;
};

export function ShopReelPageHero(props: {
  title: string;
  subtitle: string;
  actions: HeroAction[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[linear-gradient(140deg,rgba(95,67,255,0.24),rgba(20,26,56,0.82)_45%,rgba(21,112,161,0.18))] p-4 md:p-5">
      <h1 className="text-2xl font-semibold text-white md:text-3xl">{props.title}</h1>
      <p className="mt-1.5 max-w-3xl text-sm text-white/75">{props.subtitle}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {props.actions.map((action) => (
          <Link key={action.label} href={action.href} className={action.primary ? "rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-3.5 py-2 text-sm font-semibold text-white" : "rounded-xl border border-white/15 bg-black/35 px-3.5 py-2 text-sm font-medium text-white/85"}>
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ShopReelSurface(props: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h2 className="text-base font-semibold text-white">{props.title}</h2>{props.description ? <p className="mt-1 text-sm text-white/70">{props.description}</p> : null}<div className="mt-3">{props.children}</div></section>;
}

export function ShopReelEmptyState(props: { title: string; description: string; ctaLabel?: string; ctaHref?: string }) {
  return <div className={cx("rounded-2xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}><div className="text-base font-semibold text-white">{props.title}</div><p className="mt-1 text-sm text-white/75">{props.description}</p>{props.ctaLabel && props.ctaHref ? <Link href={props.ctaHref} className="mt-3 inline-flex rounded-lg bg-gradient-to-r from-violet-500 to-cyan-400 px-3 py-1.5 text-sm font-medium text-white">{props.ctaLabel}</Link> : null}</div>;
}

export function ShopReelActionRail(props: { title: string; items: string[] }) {
  return <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="text-sm font-semibold text-white">{props.title}</h3><div className="mt-3 space-y-2">{props.items.map((item) => <div key={item} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/75">{item}</div>)}</div></aside>;
}
