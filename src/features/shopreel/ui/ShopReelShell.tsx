import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/shopreel", label: "Overview" },
  { href: "/shopreel/opportunities", label: "Opportunities" },
  { href: "/shopreel/calendar", label: "Calendar" },
  { href: "/shopreel/render-queue", label: "Render Queue" },
  { href: "/shopreel/published", label: "Published" },
  { href: "/shopreel/analytics", label: "Analytics" },
];

export default function ShopReelShell(props: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { title, subtitle, children } = props;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(184,115,51,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_24%),linear-gradient(180deg,#050816_0%,#071127_45%,#050816_100%)] text-white font-sans">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.35em] text-cyan-300/90">
            ShopReel
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-4 max-w-4xl text-base leading-7 text-white/72 sm:text-xl">
              {subtitle}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/82 transition hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-6">{children}</div>
      </div>
    </div>
  );
}