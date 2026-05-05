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
  { label: "Projects", compactLabel: "PR", href: "/shopreel/generations", icon: "▣" },
  { label: "Library", compactLabel: "LB", href: "/shopreel/library", icon: "◫" },
  { label: "Calendar", compactLabel: "CA", href: "/shopreel/calendar", icon: "◷" },
  { label: "Settings", compactLabel: "ST", href: "/shopreel/settings", icon: "⚙" },
];

const STUDIO_ITEMS: SidebarItem[] = [
  { label: "Render queue", compactLabel: "RQ", href: "/shopreel/render-jobs", icon: "◌" },
  { label: "Exports", compactLabel: "EX", href: "/shopreel/exports", icon: "⇩" },
  { label: "Ideas", compactLabel: "ID", href: "/shopreel/opportunities", icon: "◈" },
  { label: "Editor", compactLabel: "ED", href: "/shopreel/editor", icon: "✎" },
];

const WORKSPACE_SIGNALS = ["3 drafts in review", "2 renders processing", "6 ready to publish"];

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
              "group rounded-2xl px-2.5 py-2 text-sm font-medium no-underline transition duration-200",
              collapsed ? "flex h-11 items-center justify-center" : "flex items-center gap-2.5",
              active
                ? "border border-violet-300/35 bg-gradient-to-r from-violet-500/20 to-cyan-400/15 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_30px_rgba(101,67,255,0.25)]"
                : cx("border border-transparent", glassTheme.text.secondary, "hover:border-white/10 hover:bg-white/[0.06] hover:text-white"),
            )}
            title={collapsed ? item.label : undefined}
          >
            <span
              className={cx(
                "inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-xs",
                active ? "bg-white/[0.22] text-white" : "bg-white/[0.06] text-white/70",
              )}
            >
              {collapsed ? item.compactLabel : item.icon}
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
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 hidden border-r bg-[radial-gradient(circle_at_25%_10%,rgba(108,71,255,0.2),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(74,222,255,0.12),transparent_38%),linear-gradient(180deg,rgba(7,10,26,0.98),rgba(4,8,20,0.98))] transition-all duration-300 lg:block",
          collapsed ? "w-24" : "w-80",
          glassTheme.border.softer,
        )}
      >
        <div className="flex h-full flex-col px-3 py-4">
          <div className={cx("mb-4 rounded-3xl border border-white/12 bg-white/[0.03] p-4", collapsed ? "flex items-center justify-center" : "space-y-3")}>
            {!collapsed ? (
              <>
                <div>
                  <div className="text-[11px] tracking-[0.2em] text-cyan-200/70">SHOPREEL STUDIO</div>
                  <div className="mt-1 text-lg font-semibold text-white">AI Content Engine</div>
                  <div className="text-xs text-white/60">For creators, brands, teams, and agencies.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">Workspace</div>
                  <div className="text-sm text-white/90">Creator Workspace · Pro plan</div>
                </div>
              </>
            ) : null}
            <button type="button" onClick={onToggleCollapse} className={cx("inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]", glassTheme.text.secondary)}>
              {collapsed ? "→" : "←"}
            </button>
          </div>

          <nav className="space-y-4 overflow-y-auto pb-4">
            {renderItems(PRIMARY_ITEMS)}
            {!collapsed ? <div className="px-2 text-xs uppercase tracking-[0.18em] text-white/45">Studio</div> : null}
            {renderItems(STUDIO_ITEMS)}

            {!collapsed ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-white/50">Pipeline signals</div>
                <div className="mt-2 space-y-2">
                  {WORKSPACE_SIGNALS.map((signal) => (
                    <div key={signal} className="rounded-xl border border-white/10 bg-black/20 px-2.5 py-2 text-xs text-white/75">{signal}</div>
                  ))}
                </div>
              </div>
            ) : null}
          </nav>
        </div>
      </aside>
    </>
  );
}
