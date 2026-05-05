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
    <div className="grid gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeAfterNavigate ? onCloseMobile : undefined}
            className={cx(
              "group rounded-lg px-2 py-1.5 text-sm font-medium no-underline transition",
              collapsed ? "flex h-10 items-center justify-center" : "flex items-center gap-2",
              active
                ? cx("border border-white/14", "bg-white/[0.1]", glassTheme.text.primary)
                : cx("border border-transparent", glassTheme.text.secondary, "hover:bg-white/[0.04] hover:text-white"),
            )}
            title={collapsed ? item.label : undefined}
          >
            <span className={cx("inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[10px] font-semibold", active ? "bg-white/[0.16] text-white" : "text-white/55")}>
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
      <button type="button" className={cx("fixed inset-0 z-40 bg-black/45 transition lg:hidden", mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")} onClick={onCloseMobile} />
      <aside className={cx("fixed inset-y-0 left-0 z-50 border-r transition-all duration-300 hidden lg:block", collapsed ? "w-24" : "w-72", glassTheme.border.softer, glassTheme.glass.panelSoft)}>
        <div className="flex h-full flex-col px-3 py-4">
          <div className={cx("mb-4 flex items-center rounded-xl border px-2 py-2", glassTheme.border.softer, collapsed ? "justify-center" : "justify-between")}>
            {!collapsed ? <div><div className={cx("text-[10px] uppercase tracking-[0.2em]", glassTheme.text.copper)}>ShopReel</div><div className={cx("text-sm font-semibold", glassTheme.text.primary)}>AI Content Engine</div></div> : null}
            <button type="button" onClick={onToggleCollapse} className={cx("inline-flex h-7 w-7 items-center justify-center rounded-lg", glassTheme.text.secondary)}>{collapsed ? "→" : "←"}</button>
          </div>
          <nav className="space-y-4 overflow-y-auto">
            {renderItems(PRIMARY_ITEMS)}
            {!collapsed ? <div className={cx("px-2 text-[10px] uppercase tracking-[0.16em]", glassTheme.text.muted)}>More</div> : null}
            {renderItems(MORE_ITEMS)}
          </nav>
        </div>
      </aside>
    </>
  );
}
