"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SHOPREEL_MVP_FLAGS } from "@/features/shopreel/config/featureFlags";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

type SidebarItem = {
  label: string;
  compactLabel: string;
  href: string;
  status?: "experimental" | "deprecated" | "contextual";
};

type SidebarGroup = {
  label: string;
  items: SidebarItem[];
};

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: "Canonical MVP",
    items: [
      { label: "Home", compactLabel: "HM", href: "/shopreel" },
      { label: "Create", compactLabel: "CR", href: "/shopreel/create" },
      { label: "Review", compactLabel: "RV", href: "/shopreel/generations" },
      { label: "Render Jobs", compactLabel: "RJ", href: "/shopreel/render-jobs" },
      { label: "Exports", compactLabel: "EX", href: "/shopreel/exports" },
      { label: "Library", compactLabel: "LB", href: "/shopreel/library" },
      { label: "Settings", compactLabel: "ST", href: "/shopreel/settings" },
    ],
  },
  {
    label: "Advanced / Legacy",
    items: [
      { label: "Manual Upload", compactLabel: "UP", href: "/shopreel/upload", status: "contextual" },
      { label: "Opportunities", compactLabel: "OP", href: "/shopreel/opportunities", status: "contextual" },
      { label: "Video Editor", compactLabel: "ED", href: "/shopreel/editor", status: "contextual" },
      { label: "Render Queue", compactLabel: "RQ", href: "/shopreel/render-queue", status: "contextual" },
      { label: "Content", compactLabel: "CT", href: "/shopreel/content", status: "contextual" },
      { label: "Publish Center", compactLabel: "PC", href: "/shopreel/publish-center", status: "contextual" },
      { label: "Publish Queue", compactLabel: "PQ", href: "/shopreel/publish-queue", status: "contextual" },
      { label: "Published", compactLabel: "PH", href: "/shopreel/published", status: "contextual" },
      { label: "Calendar", compactLabel: "CA", href: "/shopreel/calendar", status: "contextual" },
      { label: "Campaigns", compactLabel: "CP", href: "/shopreel/campaigns", status: "experimental" },
      { label: "Video Creation Studio", compactLabel: "VS", href: "/shopreel/video-creation", status: "experimental" },
      { label: "AI Requests", compactLabel: "AI", href: "/shopreel/creator-requests", status: "experimental" },
    ],
  },
];

const RESOLVED_GROUPS = SHOPREEL_MVP_FLAGS.showAdvancedRoutes
  ? SIDEBAR_GROUPS
  : SIDEBAR_GROUPS.filter((group) => group.label !== "Advanced / Legacy");

function normalizePathname(pathname: string): string {
  if (pathname === "/shopreel/dashboard") return "/shopreel";
  return pathname;
}

function isActive(pathname: string, href: string): boolean {
  const current = normalizePathname(pathname);
  if (href === "/shopreel") return current === href;
  return current === href || current.startsWith(`${href}/`);
}

type ShopReelSidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export default function ShopReelSidebar(props: ShopReelSidebarProps) {
  const { collapsed, onToggleCollapse, mobileOpen, onCloseMobile } = props;
  const pathname = usePathname() ?? "";

  return (
    <>
      <button
        type="button"
        className={cx(
          "fixed inset-0 z-40 bg-black/45 transition lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
      />

      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 border-r transition-all duration-300",
          collapsed ? "w-24" : "w-72",
          glassTheme.border.softer,
          glassTheme.glass.panelSoft,
          "hidden lg:block",
          "lg:bg-[linear-gradient(180deg,rgba(9,11,19,0.92),rgba(9,11,19,0.78))]",
          "bg-[linear-gradient(180deg,rgba(9,11,19,0.96),rgba(9,11,19,0.9))]",
        )}
        aria-label="ShopReel navigation"
      >
        <SidebarBody
          collapsed={collapsed}
          pathname={pathname}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 w-72 border-r transition-transform duration-300 lg:hidden",
          glassTheme.border.softer,
          glassTheme.glass.panelStrong,
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="ShopReel mobile navigation"
      >
        <SidebarBody
          collapsed={false}
          pathname={pathname}
          onToggleCollapse={onCloseMobile}
          closeAfterNavigate
        />
      </aside>
    </>
  );
}

function SidebarBody(props: {
  collapsed: boolean;
  pathname: string;
  onToggleCollapse: () => void;
  closeAfterNavigate?: boolean;
}) {
  const { collapsed, pathname, onToggleCollapse, closeAfterNavigate = false } = props;

  return (
    <div className="flex h-full flex-col px-3 py-4">
      <div
        className={cx(
          "mb-4 flex items-center rounded-xl border px-2 py-2",
          glassTheme.border.softer,
          "bg-white/[0.02]",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <div className={cx("min-w-0", collapsed && "sr-only")}>
          <div className={cx("text-[10px] uppercase tracking-[0.2em]", glassTheme.text.copper)}>ShopReel</div>
          <div className={cx("mt-1 text-sm font-semibold", glassTheme.text.primary)}>Operations</div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cx(
            "inline-flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-semibold transition",
            glassTheme.text.secondary,
            "hover:bg-white/[0.08] hover:text-white",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="grid gap-3 overflow-y-auto pb-2">
        {RESOLVED_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <div className={cx("mb-1 px-2 text-[10px] uppercase tracking-[0.16em]", glassTheme.text.muted)}>
                {group.label}
              </div>
            ) : null}
            <div className="grid gap-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeAfterNavigate ? onToggleCollapse : undefined}
                    className={cx(
                      "group rounded-lg px-2 py-1.5 text-sm font-medium no-underline transition",
                      collapsed ? "flex h-10 items-center justify-center" : "flex items-center gap-2",
                      active
                        ? cx(
                            "border border-white/14",
                            "bg-white/[0.1] shadow-[inset_2px_0_0_rgba(255,255,255,0.85)]",
                            glassTheme.text.primary,
                          )
                        : cx(
                            "border border-transparent",
                            glassTheme.text.secondary,
                            "hover:bg-white/[0.04] hover:text-white",
                          ),
                    )}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <span
                      className={cx(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[10px] font-semibold tracking-wide",
                        active
                          ? "bg-white/[0.16] text-white"
                          : "text-white/55 group-hover:text-white/80",
                      )}
                    >
                      {item.compactLabel}
                    </span>
                    {!collapsed ? <span>{item.label}</span> : null}
                    {!collapsed && item.status ? (
                      <span className={cx("ml-auto text-[10px] uppercase tracking-wide", glassTheme.text.muted)}>
                        {item.status}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
