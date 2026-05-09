import type { ReactNode } from "react";
import ShopReelNotificationsBell from "@/features/shopreel/ui/ShopReelNotificationsBell";
import type { CognitiveState } from "@/features/shopreel/ui/system/cognitiveState";
import { deriveCognitiveShellDynamics } from "@/features/shopreel/ui/system/cognitiveState";

type GlassShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  hidePageIntro?: boolean;
  className?: string;
  cognitiveState?: CognitiveState | null;
};

export default function GlassShell({
  eyebrow = "ShopReel",
  title,
  subtitle,
  actions,
  children,
  hidePageIntro = false,
  className = "",
  cognitiveState = null,
}: GlassShellProps) {
  const dynamics = deriveCognitiveShellDynamics(cognitiveState);
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 text-white sm:px-6 lg:px-8" style={{ letterSpacing: `${(dynamics.gravity - 50) * 0.0012}em` }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="shopreel-orb shopreel-orb-a" />
        <div className="shopreel-orb shopreel-orb-b" />
        <div className="shopreel-orb shopreel-orb-c" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(122,92,255,0.12),transparent_28%),linear-gradient(180deg,rgba(5,8,18,0.55),rgba(2,4,12,0.92))]" style={{ opacity: 0.72 + dynamics.shellDensity / 400 }} />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:44px_44px]" style={{ opacity: 0.015 + dynamics.quieting / 2600 }} />
      </div>

      <div className={`relative z-10 mx-auto w-full max-w-[1540px] ${className}`}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="hidden rounded-full border border-slate-400/10 bg-white/[0.035] px-3 py-1.5 text-xs font-medium text-white/55 shadow-2xl backdrop-blur md:block">
            AI creative operating system
          </div>
          <div className="ml-auto flex items-center gap-2">
            {actions}
            <ShopReelNotificationsBell />
          </div>
        </div>

        {!hidePageIntro ? (
          <section className="mb-6 overflow-hidden rounded-[2rem] border border-slate-400/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,.42)] backdrop-blur-2xl sm:p-7">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(139,92,246,.24),transparent_34%),radial-gradient(circle_at_95%_12%,rgba(34,211,238,.18),transparent_30%)]" />
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-200/75">
              {eyebrow}
            </p>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <div className="pb-10">{children}</div>
      </div>
    </main>
  );
}
