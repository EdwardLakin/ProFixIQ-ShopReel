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
  hideNotificationsBell?: boolean;
  fullBleed?: boolean;
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
  hideNotificationsBell = false,
  fullBleed = false,
}: GlassShellProps) {
  const dynamics = deriveCognitiveShellDynamics(cognitiveState);
  const shellOpacity = 0.64 + dynamics.shellDensity / 500;
  return (
    <main className={`shopreel-route-shell relative min-h-screen overflow-hidden text-white ${fullBleed ? "px-0 py-0" : "px-4 py-5 sm:px-6 lg:px-8"}`} style={{ letterSpacing: `${(dynamics.gravity - 50) * 0.0009}em` }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="shopreel-orb shopreel-orb-a" />
        <div className="shopreel-orb shopreel-orb-b" />
        <div className="shopreel-orb shopreel-orb-c" />
        <div className="absolute inset-0 transition-opacity duration-500 bg-[radial-gradient(circle_at_top,rgba(122,92,255,0.1),transparent_30%),linear-gradient(180deg,rgba(5,8,18,0.52),rgba(2,4,12,0.9))]" style={{ opacity: shellOpacity }} />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(148,163,184,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.45)_1px,transparent_1px)] [background-size:44px_44px]" style={{ opacity: 0.008 + dynamics.quieting / 3200 }} />
      </div>

      <div className={`relative z-10 ${fullBleed ? "w-full max-w-none" : "mx-auto w-full max-w-[1540px]"} ${className}`}>
        <div className={`${fullBleed ? "mb-0" : "mb-5"} flex items-center justify-end gap-3 transition-all duration-300`}>
          <div className="ml-auto flex items-center gap-2">
            {actions}
            {!hideNotificationsBell ? <ShopReelNotificationsBell /> : null}
          </div>
        </div>

        {!hidePageIntro ? (
          <section className="mb-6 overflow-hidden rounded-[2rem] border border-slate-400/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,.42)] backdrop-blur-2xl transition-all duration-300 sm:p-7">
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

        <div className={fullBleed ? "" : "pb-10"}>{children}</div>
      </div>
    </main>
  );
}
