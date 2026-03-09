"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.10),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_18%),linear-gradient(180deg,#04070f_0%,#071127_48%,#04070f_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-[rgba(148,163,184,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.09),transparent_34%)] px-6 py-7 sm:px-8 sm:py-9">
            <div className="mb-3 text-[12px] uppercase tracking-[0.38em] text-[#d7a07b]">
              ShopReel
            </div>

            <h1
              className="font-display text-[2.2rem] leading-[1.02] tracking-[0.01em] text-white sm:text-[3.4rem] lg:text-[4rem]"
              style={{ fontFamily: "var(--font-blackops), var(--font-inter), system-ui, sans-serif" }}
            >
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-5 max-w-4xl text-base leading-7 text-white/78 sm:text-[1.15rem]">
                {subtitle}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/shopreel"
                    ? pathname === "/shopreel"
                    : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "rounded-full border px-5 py-2.5 text-sm font-medium transition",
                      isActive
                        ? "border-[rgba(193,102,59,0.42)] bg-[rgba(193,102,59,0.14)] text-[#f3c7a4] shadow-[0_0_0_1px_rgba(193,102,59,0.14)]"
                        : "border-white/10 bg-white/[0.03] text-white/88 hover:border-[rgba(193,102,59,0.34)] hover:bg-[rgba(193,102,59,0.10)] hover:text-white",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-6">{children}</div>
      </div>
    </div>
  );
}
