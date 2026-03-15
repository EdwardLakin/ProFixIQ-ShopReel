"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { glassTheme, cx } from "./system/glassTheme";

type NavItem = {
  label: string;
  href: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/shopreel" },
      { label: "Account", href: "/shopreel/account" },
    ],
  },
  {
    label: "Manual",
    items: [
      { label: "Create", href: "/shopreel/create" },
      { label: "Upload", href: "/shopreel/upload" },
      { label: "Content", href: "/shopreel/content" },
    ],
  },
  {
    label: "AI",
    items: [
      { label: "Opportunities", href: "/shopreel/opportunities" },
      { label: "Creator Requests", href: "/shopreel/creator-requests" },
      { label: "Calendar", href: "/shopreel/calendar" },
    ],
  },
  {
    label: "Production",
    items: [
      { label: "Render Queue", href: "/shopreel/render-queue" },
      { label: "Published", href: "/shopreel/published" },
      { label: "Analytics", href: "/shopreel/analytics" },
      { label: "Settings", href: "/shopreel/settings" },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/shopreel" && pathname.startsWith(href + "/"));
}

export default function ShopReelNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 space-y-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-2">
          <div
            className={cx(
              "text-[11px] uppercase tracking-[0.22em]",
              glassTheme.text.muted,
            )}
          >
            {group.label}
          </div>

          <nav className="flex flex-wrap gap-2">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);

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
        </div>
      ))}
    </div>
  );
}
