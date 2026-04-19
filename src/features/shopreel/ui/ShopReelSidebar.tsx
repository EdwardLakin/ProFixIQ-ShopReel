"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    label: "Home",
    items: [{ label: "Home", compactLabel: "HM", href: "/shopreel" }],
  },
  {
    label: "Create",
    items: [
      { label: "Create", compactLabel: "CR", href: "/shopreel/create" },
      { label: "Manual Upload", compactLabel: "UP", href: "/shopreel/upload", status: "contextual" },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { label: "Opportunities", compactLabel: "OP", href: "/shopreel/opportunities" },
      { label: "Review / Generations", compactLabel: "RV", href: "/shopreel/generations" },
      { label: "Video Processing", compactLabel: "VP", href: "/shopreel/render-queue" },
      { label: "Content Library", compactLabel: "LB", href: "/shopreel/content" },
    ],
  },
  {
    label: "Publish",
    items: [
      { label: "Operations Board", compactLabel: "OB", href: "/shopreel/publish-center" },
      { label: "Publish Queue", compactLabel: "PQ", href: "/shopreel/publish-queue" },
      { label: "Calendar", compactLabel: "CA", href: "/shopreel/calendar" },
      { label: "Publishing History", compactLabel: "PH", href: "/shopreel/published", status: "contextual" },
      { label: "Analytics", compactLabel: "AN", href: "/shopreel/analytics", status: "contextual" },
    ],
  },
  {
    label: "Workspace",
    items: [{ label: "Settings", compactLabel: "ST", href: "/shopreel/settings" }],
  },
  {
    label: "Advanced / Experimental",
    items: [
      { label: "Campaigns", compactLabel: "CP", href: "/shopreel/campaigns", status: "experimental" },
      { label: "Video Creation Studio", compactLabel: "VS", href: "/shopreel/video-creation", status: "experimental" },
      { label: "AI Requests", compactLabel: "AI", href: "/shopreel/creator-requests", status: "experimental" },
      { label: "Editor Hub", compactLabel: "ED", href: "/shopreel/editor", status: "contextual" },
    ],
  },
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
      <div className={cx("mb-4 flex items-center", collapsed ? "justify-center" : "justify-between")}>
        <div className={cx("min-w-0", collapsed && "sr-only")}>
          <div className={cx("text-[10px] uppercase tracking-[0.2em]", glassTheme.text.copper)}>
            ShopReel
          </div>
          <div className={cx("mt-1 text-base font-semibold", glassTheme.text.primary)}>
            Operations
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cx(
            "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold transition",
            glassTheme.border.softer,
            glassTheme.glass.panelSoft,
            glassTheme.text.secondary,
            "hover:text-white hover:bg-white/[0.08]",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? ">>" : "<<"}
        </button>
      </div>

      <nav className="grid gap-3 overflow-y-auto pb-2">
        {SIDEBAR_GROUPS.map((group) => (
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
                      "group rounded-xl px-2 py-2 text-sm font-medium no-underline transition",
                      collapsed ? "flex h-10 items-center justify-center" : "flex items-center gap-2",
                      active
                        ? cx(
                            "border border-white/20",
                            "bg-white/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
                            glassTheme.text.primary,
                          )
                        : cx(
                            "border border-transparent",
                            glassTheme.text.secondary,
                            "hover:bg-white/[0.07] hover:text-white",
                          ),
                    )}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <span
                      className={cx(
                        "inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1 text-[10px] font-semibold tracking-wide",
                        active
                          ? "border-white/30 bg-white/[0.18] text-white"
                          : "border-white/12 text-white/70 group-hover:text-white",
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
