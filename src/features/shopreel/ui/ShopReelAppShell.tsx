"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import ShopReelSidebar from "@/features/shopreel/ui/ShopReelSidebar";

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
    <div className={cx("min-h-screen", glassTheme.bg.base)}>
      <ShopReelSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((current) => !current)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cx(
          "border-b px-4 py-3 lg:hidden",
          glassTheme.border.softer,
          glassTheme.glass.panelSoft,
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className={cx(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
            glassTheme.border.softer,
            glassTheme.glass.panelSoft,
            glassTheme.text.primary,
          )}
          aria-label="Open navigation"
        >
          <span aria-hidden>☰</span>
          <span>Navigation</span>
        </button>
      </div>

      <main
        className={cx(
          "transition-[padding] duration-300",
          collapsed ? "lg:pl-24" : "lg:pl-72",
        )}
      >
        {props.children}
      </main>
    </div>
  );
}
