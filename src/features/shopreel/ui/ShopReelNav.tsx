"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./system/glassTheme";

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
                ? "border-white/20 bg-white/20 text-white"
                : "border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/[0.1]"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
