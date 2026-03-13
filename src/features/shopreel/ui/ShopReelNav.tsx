"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { glassTheme, cx } from "./system/glassTheme";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/shopreel" },
  { label: "Create", href: "/shopreel/create" },
  { label: "Content", href: "/shopreel/content" },
  { label: "Upload", href: "/shopreel/upload" },
  { label: "Opportunities", href: "/shopreel/opportunities" },
  { label: "Creator Requests", href: "/shopreel/creator-requests" },
  { label: "Calendar", href: "/shopreel/calendar" },
  { label: "Render Queue", href: "/shopreel/render-queue" },
  { label: "Published", href: "/shopreel/published" },
  { label: "Analytics", href: "/shopreel/analytics" },
  { label: "Settings", href: "/shopreel/settings" },
] as const;

export default function ShopReelNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/shopreel" && pathname.startsWith(item.href + "/"));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "rounded-full border px-4 py-2 text-sm transition",
              active
                ? cx(
                    glassTheme.border.copper,
                    glassTheme.glass.panelSoft,
                    glassTheme.text.primary,
                    "shadow-[0_0_0_1px_rgba(56,189,248,0.08),0_10px_24px_rgba(0,0,0,0.18)]",
                  )
                : cx(
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                    glassTheme.text.secondary,
                    "hover:text-white hover:bg-white/[0.06]",
                  ),
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
