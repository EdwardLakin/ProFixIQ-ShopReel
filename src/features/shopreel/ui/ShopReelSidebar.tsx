"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = { label: string; href: string; icon: string; section?: "main" | "studio" | "system" };

const navItems: NavItem[] = [
  { label: "Home", href: "/shopreel", icon: "⌂", section: "main" },
  { label: "Create", href: "/shopreel/create", icon: "✦", section: "main" },
  { label: "Generations", href: "/shopreel/generations", icon: "▣", section: "main" },
  { label: "Render Queue", href: "/shopreel/render-queue", icon: "◌", section: "main" },
  { label: "Content Library", href: "/shopreel/library", icon: "◫", section: "main" },
  { label: "Publish / Export", href: "/shopreel/exports", icon: "↥", section: "main" },
  { label: "Video Studio", href: "/shopreel/video-creation/advanced", icon: "◉", section: "studio" },
  { label: "Ideas", href: "/shopreel/ideas", icon: "◇", section: "studio" },
  { label: "Editor", href: "/shopreel/editor", icon: "✎", section: "studio" },
  { label: "Campaigns", href: "/shopreel/campaigns", icon: "◎", section: "studio" },
  { label: "Settings", href: "/shopreel/settings", icon: "⚙", section: "system" },
  { label: "Billing", href: "/shopreel/billing", icon: "◍", section: "system" },
  { label: "Notifications", href: "/shopreel/notifications", icon: "🔔", section: "system" },
];

const isActivePath = (pathname: string, href: string) =>
  href === "/shopreel" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

export default function ShopReelSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className="fixed left-3 bottom-6 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-40 flex h-12 min-w-[48px] items-center gap-2 rounded-full border border-white/15 bg-[#090f21]/78 px-3 text-xs font-medium tracking-[0.08em] text-cyan-50/85 shadow-[0_8px_30px_rgba(0,0,0,.42),0_0_24px_rgba(56,189,248,.2)] backdrop-blur-xl transition hover:border-cyan-200/40 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
      >
        <span className="text-sm leading-none">☰</span>
        <span className="hidden sm:inline">Menu</span>
      </button>

      {open ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-[#02040b]/65 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(24rem,94vw)] transform overflow-x-hidden border-r border-cyan-100/10 bg-[#040812]/96 p-5 shadow-[30px_0_90px_rgba(0,0,0,.66)] backdrop-blur-2xl transition duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-5 text-xs uppercase tracking-[0.22em] text-cyan-100/70">ShopReel Navigation</div>
        <nav className="h-[calc(100vh-6.25rem)] space-y-2 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[50px] items-center gap-3 rounded-2xl px-4 py-3 text-[15px] transition ${
                  active
                    ? "bg-gradient-to-r from-cyan-400/18 to-violet-400/16 text-cyan-50 shadow-[0_0_26px_rgba(34,211,238,.16)]"
                    : "text-white/78 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
