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
  { href: "/shopreel/settings", label: "Settings" },
];

export default function ShopReelShell(props: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { title, subtitle, children } = props;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_20%),linear-gradient(180deg,#04070f_0%,#071127_48%,#04070f_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-[rgba(148,163,184,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.10),transparent_32%)] px-6 py-7 sm:px-8 sm:py-8">
            <div className="mb-3 text-[12px] uppercase tracking-[0.38em] text-[#d7a07b]">
              ShopReel
            </div>

            <h1 className="font-display text-3xl leading-none text-white sm:text-5xl">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-5 max-w-4xl text-base leading-7 text-white/78 sm:text-[1.15rem]">
                {subtitle}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/88 transition hover:border-[rgba(193,102,59,0.34)] hover:bg-[rgba(193,102,59,0.10)] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-6">{children}</div>
      </div>
    </div>
  );
}
