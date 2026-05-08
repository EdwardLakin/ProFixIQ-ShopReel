"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = { label: string; href: string; icon: string; section?: "main" | "studio" | "system" };

const navItems: NavItem[] = [
  { label: "Continue work", href: "/shopreel", icon: "⌂", section: "main" },
  { label: "Create content", href: "/shopreel/create", icon: "✦", section: "main" },
  { label: "Latest drafts", href: "/shopreel/generations", icon: "▣", section: "main" },
  { label: "Review outputs", href: "/shopreel/render-queue", icon: "◌", section: "main" },
  { label: "Asset library", href: "/shopreel/library", icon: "◫", section: "main" },
  { label: "Package & publish", href: "/shopreel/exports", icon: "↥", section: "main" },
  { label: "Video Studio", href: "/shopreel/video-creation/advanced", icon: "◉", section: "studio" },
  { label: "Ideas", href: "/shopreel/ideas", icon: "◇", section: "studio" },
  { label: "Editor", href: "/shopreel/editor", icon: "✎", section: "studio" },
  { label: "Monitor campaigns", href: "/shopreel/campaigns", icon: "◎", section: "studio" },
  { label: "Settings", href: "/shopreel/settings", icon: "⚙", section: "system" },
];

const isActivePath = (pathname: string, href: string) =>
  href === "/shopreel" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

export default function ShopReelSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <div
        className="fixed left-0 top-0 z-40 h-full w-8 sm:w-10"
        onTouchStart={(e) => setStartX(e.touches[0]?.clientX ?? null)}
        onTouchMove={(e) => {
          const currentX = e.touches[0]?.clientX;
          if (startX !== null && currentX > startX + 28) setOpen(true);
        }}
        onTouchEnd={() => setStartX(null)}
      />
      <button
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((v) => !v)}
        className="fixed left-2 bottom-4 sm:bottom-auto sm:top-6 z-50 flex h-12 min-w-[74px] items-center justify-center gap-2 rounded-full border border-white/15 bg-[#090f21]/85 px-3 text-xs font-medium tracking-[0.08em] text-cyan-50/90 shadow-[0_8px_30px_rgba(0,0,0,.42),0_0_24px_rgba(56,189,248,.2)] backdrop-blur-xl"
      >
        <span className="text-sm leading-none">☰</span><span>Launch</span>
      </button>

      {open ? <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-40 bg-[#02040b]/65 backdrop-blur-[1px]" onClick={() => setOpen(false)} /> : null}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[min(24rem,94vw)] transform overflow-x-hidden border-r border-cyan-100/10 bg-[#040812]/96 p-5 shadow-[30px_0_90px_rgba(0,0,0,.66)] backdrop-blur-2xl transition duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-5 text-xs uppercase tracking-[0.22em] text-cyan-100/70">Workflow launcher</div>
        <nav className="h-[calc(100vh-6.25rem)] space-y-2 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return <Link key={item.href} href={item.href} className={`flex min-h-[50px] items-center gap-3 rounded-2xl px-4 py-3 text-[15px] transition ${active ? "bg-gradient-to-r from-cyan-400/18 to-violet-400/16 text-cyan-50" : "text-white/78 hover:bg-white/8 hover:text-white"}`}><span className="text-base leading-none">{item.icon}</span><span>{item.label}</span></Link>;
          })}
        </nav>
      </aside>
    </>
  );
}
