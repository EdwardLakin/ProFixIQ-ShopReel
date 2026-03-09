"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function ShopReelNav() {
  const pathname = usePathname();

  return (
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
              "rounded-full px-5 py-2.5 text-sm font-medium transition",
              "border backdrop-blur-sm",
              isActive
                ? "border-[rgba(225,176,139,0.55)] bg-[linear-gradient(180deg,rgba(193,102,59,0.22),rgba(126,64,35,0.14))] text-[#f3cfb4] shadow-[0_0_0_1px_rgba(193,102,59,0.12),0_10px_26px_rgba(0,0,0,0.22)]"
                : "border-white/8 bg-white/[0.035] text-white/82 hover:border-[rgba(193,102,59,0.34)] hover:bg-[rgba(193,102,59,0.10)] hover:text-white",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
