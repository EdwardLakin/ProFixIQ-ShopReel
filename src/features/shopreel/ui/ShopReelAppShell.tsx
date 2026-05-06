"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import ShopReelSidebar from "@/features/shopreel/ui/ShopReelSidebar";
import ShopReelNotificationsBell from "@/features/shopreel/ui/ShopReelNotificationsBell";

const SIDEBAR_STORAGE_KEY = "shopreel-sidebar-collapsed";

export default function ShopReelAppShell(props: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      setCollapsed(stored === "1");
    } catch {
      setCollapsed(false);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // no-op when storage is unavailable
    }
  }, [collapsed]);

  return (
    <div className={cx("min-h-screen bg-[#04081a]", glassTheme.bg.base)}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(105,80,255,0.2),transparent_36%),radial-gradient(circle_at_85%_10%,rgba(70,201,255,0.16),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_16%)]" />

      <ShopReelSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((current) => !current)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={cx("sticky top-0 z-30 border-b px-4 py-3 backdrop-blur-xl lg:hidden", glassTheme.border.softer, "bg-slate-950/65")}>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className={cx("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm", glassTheme.border.softer, "bg-white/[0.04]", glassTheme.text.primary)}
          aria-label="Open navigation"
        >
          <span aria-hidden>☰</span>
          <span>Open studio nav</span>
        </button>
      </div>

      <div className={cx("relative z-20 flex justify-end px-4 pt-3", collapsed ? "lg:pl-20" : "lg:pl-60")}>
        <ShopReelNotificationsBell />
      </div>

      <main className={cx("relative transition-[padding] duration-300", collapsed ? "lg:pl-20" : "lg:pl-60")}>{props.children}</main>
    </div>
  );
}
