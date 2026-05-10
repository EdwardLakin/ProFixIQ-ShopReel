"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getManualNavRoutes } from "@/features/shopreel/ui/system/shopReelRouteRegistry";

const iconByPath: Record<string, string> = {
  "/shopreel": "⌂",
  "/shopreel/create": "✦",
  "/shopreel/campaigns": "◎",
  "/shopreel/ideas": "◇",
  "/shopreel/opportunities": "◈",
  "/shopreel/upload": "⤴",
  "/shopreel/video-creation": "◉",
  "/shopreel/render-queue": "◌",
  "/shopreel/exports": "↥",
  "/shopreel/library": "◫",
  "/shopreel/publish-center": "⇪",
  "/shopreel/publish-queue": "☰",
  "/shopreel/editor": "✎",
  "/shopreel/review": "✓",
};

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
        className="pointer-events-auto fixed left-0 top-0 z-[65] h-full w-10 touch-pan-y sm:w-12"
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
        className="fixed bottom-4 left-3 z-[95] flex h-12 min-w-[92px] items-center justify-center gap-2 rounded-full border border-white/15 bg-[#090f21]/90 px-3 text-xs font-medium tracking-[0.08em] text-cyan-50/90 shadow-[0_8px_30px_rgba(0,0,0,.42),0_0_24px_rgba(56,189,248,.2)] touch-manipulation backdrop-blur-xl sm:bottom-auto sm:top-6"
      >
        <span className="text-sm leading-none">☰</span><span>Launch</span>
      </button>

      {open ? <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-[85] bg-[#02040b]/65 backdrop-blur-[1px]" onClick={() => setOpen(false)} /> : null}

      <aside className={`fixed inset-y-0 left-0 z-[90] w-[min(24rem,94vw)] transform overflow-x-hidden border-r border-cyan-100/10 bg-[#040812]/96 p-5 shadow-[30px_0_90px_rgba(0,0,0,.66)] backdrop-blur-2xl transition duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-5 text-xs uppercase tracking-[0.22em] text-cyan-100/70">Workflow launcher</div>
        <nav className="h-[calc(100vh-6.25rem)] space-y-2 overflow-y-auto pr-1">
          {getManualNavRoutes().map((item) => {
            const active = isActivePath(pathname, item.path);
            return <Link key={item.path} href={item.path} className={`flex min-h-[50px] items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[15px] transition ${active ? "bg-gradient-to-r from-cyan-400/18 to-violet-400/16 text-cyan-50" : "text-white/78 hover:bg-white/8 hover:text-white"}`}><span className="flex items-center gap-3"><span className="text-base leading-none">{iconByPath[item.path] ?? "•"}</span><span>{item.label}</span></span>{item.lifecycleStatus === "usable_but_partial" ? <span className="rounded-full border border-amber-300/40 px-2 py-0.5 text-[10px] uppercase text-amber-100">Partial</span> : null}</Link>;
          })}
        </nav>
      </aside>
    </>
  );
}
