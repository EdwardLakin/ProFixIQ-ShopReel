"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

type NavItem = {
  label: string;
  href: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const GROUPS: NavGroup[] = [
  {
    label: "Home",
    items: [
      { label: "Home", href: "/shopreel" },
      { label: "Workspace", href: "/shopreel/account" },
    ],
  },
  {
    label: "Create",
    items: [
      { label: "Create", href: "/shopreel/create" },
      { label: "Upload", href: "/shopreel/upload" },
      { label: "Opportunities", href: "/shopreel/opportunities" },
      { label: "AI Requests", href: "/shopreel/creator-requests" },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { label: "Library", href: "/shopreel/content" },
      { label: "Generations", href: "/shopreel/generations" },
      { label: "Video Processing", href: "/shopreel/render-queue" },
    ],
  },
  {
    label: "Publish",
    items: [
      { label: "Publish Center", href: "/shopreel/publish-center" },
      { label: "Calendar", href: "/shopreel/calendar" },
      { label: "Publishing History", href: "/shopreel/published" },
      { label: "Analytics", href: "/shopreel/analytics" },
    ],
  },
  {
    label: "Settings",
    items: [{ label: "Settings", href: "/shopreel/settings" }],
  },
];

function normalizePathname(pathname: string): string {
  if (pathname === "/shopreel/dashboard") return "/shopreel";
  return pathname;
}

function isActive(pathname: string, href: string): boolean {
  const current = normalizePathname(pathname);

  if (href === "/shopreel") {
    return current === "/shopreel";
  }

  return current === href || current.startsWith(`${href}/`);
}

export default function ShopReelNav() {
  const pathname = usePathname() ?? "";
  const currentPath = normalizePathname(pathname);

  return (
    <nav className="grid gap-5 lg:grid-cols-5">
      {GROUPS.map((group) => (
        <section key={group.label} className="space-y-3">
          <div
            className={cx(
              "text-xs uppercase tracking-[0.24em]",
              glassTheme.text.copper
            )}
          >
            {group.label}
          </div>

          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => {
              const active = isActive(currentPath, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium transition no-underline",
                    active
                      ? cx(
                          glassTheme.border.copper,
                          glassTheme.glass.panelStrong,
                          glassTheme.text.primary,
                          "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_12px_30px_rgba(0,0,0,0.22)]"
                        )
                      : cx(
                          glassTheme.border.softer,
                          glassTheme.glass.panelSoft,
                          glassTheme.text.secondary,
                          "hover:bg-white/[0.06] hover:text-white"
                        )
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}
