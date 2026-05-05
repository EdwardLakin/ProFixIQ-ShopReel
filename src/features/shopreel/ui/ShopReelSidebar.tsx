"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

type SidebarItem = {
  label: string;
  compactLabel: string;
  href: string;
};

const PRIMARY_ITEMS: SidebarItem[] = [
  { label: "Home", compactLabel: "HM", href: "/shopreel" },
  { label: "Create", compactLabel: "CR", href: "/shopreel/create" },
  { label: "Projects", compactLabel: "PR", href: "/shopreel/generations" },
  { label: "Library", compactLabel: "LB", href: "/shopreel/library" },
  { label: "Calendar", compactLabel: "CA", href: "/shopreel/calendar" },
  { label: "Settings", compactLabel: "ST", href: "/shopreel/settings" },
];

const MORE_ITEMS: SidebarItem[] = [
  { label: "Processing", compactLabel: "PS", href: "/shopreel/render-jobs" },
  { label: "Downloads", compactLabel: "DL", href: "/shopreel/exports" },
  { label: "Ideas", compactLabel: "ID", href: "/shopreel/opportunities" },
  { label: "Editor", compactLabel: "ED", href: "/shopreel/editor" },
];

function normalizePathname(pathname: string): string {
  return pathname === "/shopreel/dashboard" ? "/shopreel" : pathname;
}

function isActive(pathname: string, href: string): boolean {
  const current = normalizePathname(pathname);
  return href === "/shopreel" ? current === href : current === href || current.startsWith(`${href}/`);
}

export default function ShopReelSidebar(props: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { collapsed, onToggleCollapse, mobileOpen, onCloseMobile } = props;
  const pathname = usePathname() ?? "";

  const renderItems = (items: SidebarItem[], closeAfterNavigate = false) => (
    <div className="grid gap-1.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeAfterNavigate ? onCloseMobile : undefined}
            className={cx(
              "group relative rounded-xl px-2.5 py-2 text-sm font-medium no-underline transition",
              collapsed ? "flex h-10 items-center justify-center" : "flex items-center gap-2.5",
              active
                ? cx("border border-white/22 bg-[linear-gradient(120deg,rgba(129,140,248,0.3),rgba(56,189,248,0.16))] text-white", "shadow-[0_10px_28px_rgba(2,6,23,0.45)]")
                : cx("border border-transparent", glassTheme.text.secondary, "hover:bg-white/[0.08] hover:text-white"),
            )}
            title={collapsed ? item.label : undefined}
          >
            <span
              className={cx(
                "inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-[10px] font-semibold",
                active ? "bg-white/[0.24] text-white" : "bg-white/[0.07] text-white/65",
              )}
            >
              {item.compactLabel}
            </span>
            {!collapsed ? <span>{item.label}</span> : null}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      <button
        type="button"
        className={cx("fixed inset-0 z-40 bg-black/45 transition lg:hidden", mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}
        onClick={onCloseMobile}
      />
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 hidden border-r bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,0.92))] shadow-[22px_0_44px_rgba(2,6,23,0.42)] transition-all duration-300 lg:block",
          collapsed ? "w-24" : "w-72",
          glassTheme.border.softer,
        )}
      >
        <div className="flex h-full flex-col px-3 py-4">
          <div
            className={cx(
              "mb-4 rounded-2xl border border-white/12 bg-white/[0.04] p-3 shadow-[0_10px_24px_rgba(2,6,23,0.34)]",
              collapsed ? "flex items-center justify-center" : "space-y-3",
            )}
          >
            {!collapsed ? (
              <>
                <div>
                  <div className="text-[10px] tracking-[0.18em] text-white/55">SHOPREEL</div>
                  <div className="text-sm font-semibold text-white">Premium AI Studio</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2">
                  <div className="text-xs text-white/60">Workspace</div>
                  <div className="text-sm text-white/90">Workspace</div>
                </div>
              </>
            ) : null}
            <button type="button" onClick={onToggleCollapse} className={cx("inline-flex h-7 w-7 items-center justify-center rounded-lg", glassTheme.text.secondary)}>
              {collapsed ? "→" : "←"}
            </button>
          </div>
          <nav className="space-y-4 overflow-y-auto">
            {renderItems(PRIMARY_ITEMS)}
            {!collapsed ? <div className="px-2 text-xs text-white/45">More</div> : null}
            {renderItems(MORE_ITEMS)}
          </nav>
        </div>
      </aside>
    </>
  );
}
