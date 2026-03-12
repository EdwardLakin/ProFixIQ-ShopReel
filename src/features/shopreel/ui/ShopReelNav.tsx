"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/shopreel", label: "Overview" },
  { href: "/shopreel/upload", label: "Upload" },
  { href: "/shopreel/opportunities", label: "Opportunities" },
  { href: "/shopreel/generations", label: "Generations" },
  { href: "/shopreel/calendar", label: "Calendar" },
  { href: "/shopreel/render-queue", label: "Render Queue" },
  { href: "/shopreel/analytics", label: "Analytics" },
  { href: "/shopreel/published", label: "Published" },
  { href: "/shopreel/settings", label: "Settings" },
];

export default function ShopReelNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cx(
        "flex flex-wrap items-center gap-2 pb-2",
        glassTheme.text.secondary
      )}
    >
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/shopreel"
            ? pathname === "/shopreel"
            : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-sky-400/10 text-white border border-sky-400/25"
                : "text-white/70 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
