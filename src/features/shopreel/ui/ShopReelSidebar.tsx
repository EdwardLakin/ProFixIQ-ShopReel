"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

type SidebarItem = {
  label: string;
  compactLabel: string;
  href: string;
  icon: string;
};

const PRIMARY_ITEMS: SidebarItem[] = [
  { label: "Home", compactLabel: "HM", href: "/shopreel", icon: "⌂" },
  { label: "Create", compactLabel: "CR", href: "/shopreel/create", icon: "✦" },
  { label: "Review / Generations", compactLabel: "RV", href: "/shopreel/generations", icon: "▣" },
  { label: "Render Queue", compactLabel: "RQ", href: "/shopreel/render-queue", icon: "◌" },
  { label: "Exports", compactLabel: "EX", href: "/shopreel/exports", icon: "⇩" },
  { label: "Library", compactLabel: "LB", href: "/shopreel/library", icon: "◫" },
  { label: "Settings", compactLabel: "ST", href: "/shopreel/settings", icon: "⚙" },
];

const SECONDARY_ITEMS: SidebarItem[] = [
  { label: "Campaigns (Advanced)", compactLabel: "CP", href: "/shopreel/campaigns", icon: "◈" },
  { label: "Operations (Operator)", compactLabel: "OP", href: "/shopreel/operations", icon: "⌘" },
  { label: "Publish Center (Advanced)", compactLabel: "PB", href: "/shopreel/publish-center", icon: "⇪" },
  { label: "Publish Queue (Advanced)", compactLabel: "PQ", href: "/shopreel/publish-queue", icon: "☰" },
  { label: "Video Studio (Advanced)", compactLabel: "VS", href: "/shopreel/video-creation/advanced", icon: "◍" },
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
              "group rounded-xl px-2.5 py-2 text-sm font-medium transition duration-200",
              collapsed ? "flex h-10 items-center justify-center" : "flex items-center gap-2.5",
              active
                ? "bg-gradient-to-r from-violet-500/30 to-cyan-400/20 text-white shadow-[0_10px_30px_rgba(82,68,255,0.3)]"
                : cx("text-white/70 hover:bg-white/[0.08] hover:text-white"),
            )}
            title={collapsed ? item.label : undefined}
          >
            <span className={cx("inline-flex h-6 min-w-6 items-center justify-center rounded-md text-xs", active ? "bg-white/20 text-white" : "bg-white/10 text-white/75")}>{collapsed ? item.compactLabel : item.icon}</span>
            {!collapsed ? <span>{item.label}</span> : null}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      <button type="button" className={cx("fixed inset-0 z-40 bg-black/55 transition lg:hidden", mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")} onClick={onCloseMobile} />
      <aside
        className={cx(
          "fixed inset-y-3 left-3 z-50 rounded-3xl border border-white/15 bg-[radial-gradient(circle_at_20%_0%,rgba(120,86,255,0.28),transparent_46%),linear-gradient(180deg,rgba(7,10,28,0.94),rgba(5,8,20,0.98))] shadow-[0_30px_80px_rgba(4,6,20,0.6)] transition-all duration-300",
          collapsed ? "w-[5.2rem]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col px-3 py-4">
          <div className={cx("mb-4 flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
            {!collapsed ? (
              <div>
                <div className="text-[11px] tracking-[0.2em] text-cyan-200/75">SHOPREEL OS</div>
                <div className="text-base font-semibold text-white">Creative Command</div>
              </div>
            ) : null}
            <button type="button" onClick={onToggleCollapse} className={cx("inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]", glassTheme.text.secondary)}>
              {collapsed ? "→" : "←"}
            </button>
          </div>

          <nav className="space-y-4 overflow-y-auto pb-4">
            {renderItems(PRIMARY_ITEMS, true)}
            {!collapsed ? <div className="px-2 text-[11px] uppercase tracking-[0.2em] text-white/45">Advanced / Operator</div> : null}
            {renderItems(SECONDARY_ITEMS, true)}
          </nav>
        </div>
      </aside>
    </>
  );
}
