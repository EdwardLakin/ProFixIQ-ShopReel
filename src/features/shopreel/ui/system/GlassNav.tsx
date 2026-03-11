"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { glassTheme, cx } from "./glassTheme";

const NAV_ITEMS = [
  { href: "/shopreel", label: "Overview" },
  { href: "/shopreel/upload", label: "Upload" },
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
        "flex flex-wrap gap-2 rounded-3xl border p-2 relative",
        glassTheme.border.soft,
        glassTheme.glass.panelSoft
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
              "relative overflow-hidden rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200",

              active
                ? "border border-sky-400/30 text-white bg-white/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]"
                : "border border-transparent text-white/70 hover:text-white hover:bg-white/[0.05]"
            )}
          >
            {active && (
              <span
                className="
                absolute inset-0 -z-10
                bg-[linear-gradient(120deg,rgba(59,130,246,0.18),rgba(139,92,246,0.18),rgba(34,211,238,0.16))]
                blur-xl opacity-70
                animate-[navGlow_6s_linear_infinite]
                "
              />
            )}

            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}