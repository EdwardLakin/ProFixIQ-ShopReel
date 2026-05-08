"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  section?: "main" | "studio" | "system";
};

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

function isActivePath(pathname: string, href: string) {
  if (href === "/shopreel") return pathname === "/shopreel";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavSection({
  title,
  items,
  pathname,
}: {
  title?: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-2">
      {title ? (
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.34em] text-white/34">
          {title}
        </p>
      ) : null}

      <nav className="space-y-1">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-sm transition duration-200",
                active
                  ? "border border-slate-400/10 bg-white/[0.085] text-white shadow-[0_16px_42px_rgba(88,80,236,.26)]"
                  : "text-white/62 hover:bg-white/[0.055] hover:text-white",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute inset-y-1 left-1 w-1 rounded-full transition",
                  active ? "bg-gradient-to-b from-violet-400 to-cyan-300 opacity-100" : "opacity-0",
                ].join(" ")}
              />
              <span
                className={[
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs transition",
                  active
                    ? "border-cyan-200/12 bg-gradient-to-br from-violet-500/55 to-cyan-400/28 text-white"
                    : "border-white/8 bg-white/[0.055] text-white/52 group-hover:text-white",
                ].join(" ")}
              >
                {item.icon}
              </span>
              <span className="relative font-medium tracking-[-0.01em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function ShopReelSidebar() {
  const pathname = usePathname();

  const main = navItems.filter((item) => item.section === "main");
  const studio = navItems.filter((item) => item.section === "studio");
  const system = navItems.filter((item) => item.section === "system");

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17.5rem] border-r border-slate-400/10 bg-[#030512]/76 p-4 shadow-[24px_0_80px_rgba(0,0,0,.44)] backdrop-blur-2xl lg:block">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(124,58,237,.22),transparent_42%),radial-gradient(circle_at_100%_28%,rgba(34,211,238,.09),transparent_36%)]" />

        <div className="relative flex h-full flex-col">
          <div className="mb-5 rounded-[1.6rem] border border-slate-400/10 bg-white/[0.055] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-cyan-200/62">
                  ShopReel
                </p>
                <h1 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-white">
                  Content Engine
                </h1>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-400/10 bg-black/24 text-xs text-white/66">
                AI
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.055] px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-100/78">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,.8)]" />
                AI studio online
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 [scrollbar-width:none]">
            <NavSection items={main} pathname={pathname} />
            <NavSection title="Studio" items={studio} pathname={pathname} />
            <NavSection title="System" items={system} pathname={pathname} />
          </div>

          <div className="mt-4 rounded-[1.45rem] border border-slate-400/10 bg-black/22 p-3">
            <p className="text-xs font-semibold text-white">Next best action</p>
            <p className="mt-1 text-xs leading-5 text-white/52">
              Create, render, package, and publish from one command workspace.
            </p>
          </div>
        </div>
      </aside>

      <div className="fixed inset-x-3 bottom-3 z-40 rounded-[1.5rem] border border-slate-400/10 bg-[#050816]/88 p-2 shadow-[0_18px_60px_rgba(0,0,0,.55)] backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {main.slice(0, 5).map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] transition",
                  active ? "bg-white/[0.095] text-white" : "text-white/54",
                ].join(" ")}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="mt-1 truncate">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
