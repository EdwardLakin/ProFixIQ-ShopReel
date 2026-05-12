"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getManualNavRoutes } from "@/features/shopreel/ui/system/shopReelRouteRegistry";

const iconByPath: Record<string, string> = {
  "/shopreel": "⌂",
  "/shopreel/campaigns": "◎",
  "/shopreel/review": "✓",
  "/shopreel/library": "◫",
  "/shopreel/settings": "⚙",
  "/shopreel/create": "✦",
  "/shopreel/render-jobs": "◍",
  "/shopreel/render-queue": "◌",
  "/shopreel/publish-center": "⇪",
  "/shopreel/publish-queue": "☰",
  "/shopreel/automation": "⟲",
  "/shopreel/operations": "⚐",
  "/shopreel/operator": "⌘",
  "/shopreel/video-creation": "◉",
  "/shopreel/video-creation/advanced": "⋯",
  "/shopreel/storyboards": "▤",
  "/shopreel/opportunities": "◈",
  "/shopreel/generations": "◧",
};
const advancedItems = [
  { path: "/shopreel/render-jobs", label: "Render jobs" },
  { path: "/shopreel/render-queue", label: "Render queue" },
  { path: "/shopreel/publish-center", label: "Publish center" },
  { path: "/shopreel/publish-queue", label: "Publish queue" },
  { path: "/shopreel/automation", label: "Automation" },
  { path: "/shopreel/operations", label: "Operations" },
  { path: "/shopreel/operator", label: "Operator console" },
  { path: "/shopreel/video-creation", label: "Video creation" },
  { path: "/shopreel/video-creation/advanced", label: "Video advanced" },
  { path: "/shopreel/storyboards", label: "Storyboards" },
  { path: "/shopreel/opportunities", label: "Opportunities" },
  { path: "/shopreel/generations", label: "Generations" },
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
        className="fixed bottom-4 left-3 z-[180] flex h-12 min-w-[92px] items-center justify-center gap-2 rounded-full border border-white/15 bg-[#090f21]/90 px-3 text-xs font-medium tracking-[0.08em] text-cyan-50/90 shadow-[0_8px_30px_rgba(0,0,0,.42),0_0_24px_rgba(56,189,248,.2)] touch-manipulation backdrop-blur-xl sm:bottom-auto sm:left-4 sm:top-4"
      >
        <span className="text-sm leading-none">☰</span><span>Launch</span>
      </button>

      {open ? <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-[85] bg-[#02040b]/65 backdrop-blur-[1px]" onClick={() => setOpen(false)} /> : null}

      <aside className={`fixed inset-y-0 left-0 z-[90] w-[min(24rem,94vw)] transform overflow-x-hidden border-r border-cyan-100/10 bg-[#040812]/96 p-5 shadow-[30px_0_90px_rgba(0,0,0,.66)] backdrop-blur-2xl transition duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-5 text-xs uppercase tracking-[0.22em] text-cyan-100/70">SHOPREEL OPERATOR</div>
        <nav className="h-[calc(100vh-6.25rem)] space-y-2 overflow-y-auto pr-1">
          {getManualNavRoutes().map((item) => {
            const active = isActivePath(pathname, item.path);
            return <Link key={item.path} href={item.path} className={`flex min-h-[50px] items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[15px] transition ${active ? "bg-gradient-to-r from-cyan-400/18 to-violet-400/16 text-cyan-50" : "text-white/78 hover:bg-white/8 hover:text-white"}`}><span className="flex items-center gap-3"><span className="text-base leading-none">{iconByPath[item.path] ?? "•"}</span><span>{item.label}</span></span>{item.lifecycleStatus === "usable_but_partial" ? <span className="rounded-full border border-amber-300/40 px-2 py-0.5 text-[10px] uppercase text-amber-100">Partial</span> : null}</Link>;
          })}
          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="mb-2 px-2 text-[10px] uppercase tracking-[0.18em] text-white/40">Advanced</div>
            <div className="space-y-1">
              {advancedItems.map((item) => {
                const active = isActivePath(pathname, item.path);
                return <Link key={item.path} href={item.path} className={`flex min-h-[38px] items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${active ? "bg-white/10 text-cyan-50" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}><span className="text-xs leading-none">{iconByPath[item.path] ?? "•"}</span><span>{item.label}</span></Link>;
              })}
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100/75">Taste profile</div>
            <p className="mt-2 text-sm text-white/90">Calm · Clear · Human</p>
            <p className="mt-1 text-xs text-white/55">Emotion-first hooks</p>
          </div>
        </nav>
      </aside>
    </>
  );
}
