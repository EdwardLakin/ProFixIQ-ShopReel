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
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
          <div className="bg-[radial-gradient(circle_at_top,rgba(193,102,59,0.12),transparent_34%),radial-gradient(circle_at_right,rgba(180,74,66,0.06),transparent_22%)] px-6 py-7 sm:px-8 sm:py-9">
            <div className="mb-3 text-[12px] uppercase tracking-[0.42em] text-[#d9a07b]">
              ShopReel
            </div>

            <h1
              className="text-[2.2rem] leading-[1.02] tracking-[0.01em] text-white sm:text-[3.2rem] lg:text-[3.8rem]"
              style={{
                fontFamily:
                  "var(--font-blackops), var(--font-inter), system-ui, sans-serif",
              }}
            >
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-5 max-w-4xl text-base leading-7 text-white/78 sm:text-[1.12rem]">
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
                      "rounded-full border px-5 py-2.5 text-sm font-medium transition backdrop-blur-xl",
                      isActive
                        ? "border-[rgba(193,102,59,0.38)] bg-[linear-gradient(180deg,rgba(193,102,59,0.18),rgba(193,102,59,0.08))] text-[#f3c9a8] shadow-[0_0_0_1px_rgba(193,102,59,0.10),0_8px_20px_rgba(0,0,0,0.12)]"
                        : "border-white/10 bg-white/[0.035] text-white/86 hover:border-[rgba(193,102,59,0.28)] hover:bg-[rgba(193,102,59,0.08)] hover:text-white",
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
