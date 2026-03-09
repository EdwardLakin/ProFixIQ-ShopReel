"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { glassTheme, cx } from "./glassTheme";

const NAV_ITEMS = [
  { href: "/shopreel", label: "Overview" },
  { href: "/shopreel/opportunities", label: "Opportunities" },
  { href: "/shopreel/calendar", label: "Calendar" },
  { href: "/shopreel/render-queue", label: "Render Queue" },
  { href: "/shopreel/analytics", label: "Analytics" },
  { href: "/shopreel/published", label: "Published" },
  { href: "/shopreel/settings", label: "Settings" },
];

export default function GlassNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cx(
        "flex flex-wrap gap-2 rounded-3xl border p-2",
        glassTheme.border.softer,
        glassTheme.glass.panel,
      )}
      aria-label="ShopReel navigation"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-150",
              active
                ? "border border-[rgba(184,115,75,0.30)] bg-[rgba(184,115,75,0.14)] text-[color:#f3ede6] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "border border-transparent text-[color:rgba(243,237,230,0.68)] hover:border-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[color:#f3ede6]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}