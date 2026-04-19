"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

type SidebarItem = {
  label: string;
  href: string;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Home", href: "/shopreel" },
  { label: "Create", href: "/shopreel/create" },
  { label: "Opportunities", href: "/shopreel/opportunities" },
  { label: "Review", href: "/shopreel/generations" },
  { label: "Video Processing", href: "/shopreel/render-queue" },
  { label: "Operations Board", href: "/shopreel/publish-center" },
  { label: "Publish Queue", href: "/shopreel/publish-queue" },
  { label: "Calendar", href: "/shopreel/calendar" },
  { label: "Publishing History", href: "/shopreel/published" },
  { label: "Analytics", href: "/shopreel/analytics" },
  { label: "Settings", href: "/shopreel/settings" },
];

function normalizePathname(pathname: string): string {
  if (pathname === "/shopreel/dashboard") return "/shopreel";
  return pathname;
}

function isActive(pathname: string, href: string): boolean {
  const current = normalizePathname(pathname);
  if (href === "/shopreel") return current === href;
  return current === href || current.startsWith(`${href}/`);
}

export default function ShopReelSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside
      className={cx(
        "fixed inset-y-0 left-0 z-40 hidden w-72 border-r lg:block",
        glassTheme.border.softer,
        glassTheme.glass.panelSoft,
      )}
      aria-label="ShopReel navigation"
    >
      <div className="flex h-full flex-col px-5 py-6">
        <div className="mb-6">
          <div className={cx("text-xs uppercase tracking-[0.24em]", glassTheme.text.copper)}>
            ShopReel
          </div>
          <div className={cx("mt-2 text-lg font-semibold", glassTheme.text.primary)}>
            Operations
          </div>
        </div>

        <nav className="grid gap-2">
          {SIDEBAR_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "rounded-xl border px-3 py-2 text-sm font-medium no-underline transition",
                  active
                    ? cx(
                        glassTheme.border.copper,
                        glassTheme.glass.panelStrong,
                        glassTheme.text.primary,
                      )
                    : cx(
                        glassTheme.border.softer,
                        glassTheme.glass.panelSoft,
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
      </div>
    </aside>
  );
}
