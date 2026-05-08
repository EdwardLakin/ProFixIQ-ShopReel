"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = { label: string; href: string; icon: string; section?: "main" | "studio" | "system" };
const navItems: NavItem[] = [
  { label: "Home", href: "/shopreel", icon: "⌂", section: "main" }, { label: "Create", href: "/shopreel/create", icon: "✦", section: "main" }, { label: "Generations", href: "/shopreel/generations", icon: "▣", section: "main" }, { label: "Render Queue", href: "/shopreel/render-queue", icon: "◌", section: "main" }, { label: "Content Library", href: "/shopreel/library", icon: "◫", section: "main" }, { label: "Publish / Export", href: "/shopreel/exports", icon: "↥", section: "main" },
  { label: "Video Studio", href: "/shopreel/video-creation/advanced", icon: "◉", section: "studio" }, { label: "Ideas", href: "/shopreel/ideas", icon: "◇", section: "studio" }, { label: "Editor", href: "/shopreel/editor", icon: "✎", section: "studio" }, { label: "Campaigns", href: "/shopreel/campaigns", icon: "◎", section: "studio" },
  { label: "Settings", href: "/shopreel/settings", icon: "⚙", section: "system" }, { label: "Billing", href: "/shopreel/billing", icon: "◍", section: "system" }, { label: "Notifications", href: "/shopreel/notifications", icon: "🔔", section: "system" },
];
const isActivePath = (pathname: string, href: string) => href === "/shopreel" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

export default function ShopReelSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  useEffect(() => setOpen(false), [pathname]);
  return <>
    <button aria-label="Open navigation menu" onMouseEnter={() => setOpen(true)} onClick={() => setOpen((v) => !v)} className="fixed inset-y-0 left-0 z-40 w-4 bg-white/[0.03] text-[10px] text-white/55 hover:bg-white/[0.08]">Menu</button>
    {open ? <button aria-label="Close navigation menu" className="fixed inset-0 z-40 bg-black/45" onClick={() => setOpen(false)} /> : null}
    <aside className={`fixed inset-y-0 left-0 z-50 w-[17rem] transform border-r border-white/10 bg-[#040712]/95 p-4 shadow-[28px_0_80px_rgba(0,0,0,.62)] backdrop-blur-2xl transition ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="mb-4 text-xs uppercase tracking-[0.2em] text-cyan-100/65">ShopReel Menu</div>
      <nav className="space-y-1 overflow-y-auto h-[calc(100vh-5rem)]">
        {navItems.map((item) => { const active = isActivePath(pathname, item.href); return <Link key={item.href} href={item.href} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${active ? "bg-cyan-400/15 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,.22)]" : "text-white/70 hover:bg-white/5"}`}><span>{item.icon}</span>{item.label}</Link>; })}
      </nav>
    </aside>
  </>;
}
