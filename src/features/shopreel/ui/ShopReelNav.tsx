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
              glassTheme.glass.panelSoft,
              active
                ? cx(
                    glassTheme.border.copper,
                    glassTheme.text.primary,
                    "bg-white/[0.09] ring-1 ring-sky-300/20",
                  )
                : cx(
                    glassTheme.border.softer,
                    glassTheme.text.secondary,
                    "hover:bg-white/[0.06] hover:text-white",
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