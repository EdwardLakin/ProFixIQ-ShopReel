import type { ReactNode } from "react";
import ShopReelSidebar from "@/features/shopreel/ui/ShopReelSidebar";
import GlobalCommandLauncher from "@/features/shopreel/ui/GlobalCommandLauncher";
import { GlobalEnvironmentAmbientLine, GlobalEnvironmentContinuityProvider, useGlobalEnvironmentContinuity } from "@/features/shopreel/ui/system/GlobalEnvironmentContinuityClient";

function ShellScaffold({ children }: { children: ReactNode }) {
  const continuity = useGlobalEnvironmentContinuity();
  const atmosphere = continuity.adaptiveAtmosphere;
  const densityClass = atmosphere?.friction === "high" ? "opacity-[0.07]" : atmosphere?.friction === "visible" ? "opacity-[0.06]" : atmosphere?.friction === "subtle" ? "opacity-[0.04]" : "opacity-[0.02]";
  const energyOpacity = atmosphere?.mode === "recovery" ? "0.12" : atmosphere?.mode === "export_momentum" ? "0.23" : atmosphere?.mode === "render_pressure" || atmosphere?.mode === "fractured" ? "0.26" : "0.18";
  const shellPadding = atmosphere?.density === "compressed" ? "pl-2 md:pl-4" : atmosphere?.density === "compact" ? "pl-3 md:pl-5" : "pl-4 md:pl-6";
  const typography = atmosphere?.hierarchy === "urgent" ? "text-white" : atmosphere?.hierarchy === "sharp" ? "text-slate-50" : "text-slate-100";
  const navProminence = atmosphere?.mode === "dormant" ? "opacity-80" : "opacity-100";
  const railEmphasis = atmosphere?.mode === "render_pressure" ? "ring-1 ring-rose-300/35" : atmosphere?.mode === "export_momentum" ? "ring-1 ring-cyan-300/25" : "";

  return (
    <div className={`min-h-screen bg-[#02040c] ${typography}`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,.18),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(34,211,238,.14),transparent_32%),linear-gradient(180deg,#050816_0%,#02040c_62%,#01020a_100%)]" style={{ opacity: Number(energyOpacity) }} />
        <div className={`absolute inset-0 ${densityClass} [background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:48px_48px]`} />
      </div>

      <div className={`relative flex min-h-screen ${railEmphasis}`}>
        <div className={navProminence}><ShopReelSidebar /></div>
        <GlobalCommandLauncher />
        <GlobalEnvironmentAmbientLine />

        <section className={`relative min-w-0 flex-1 ${shellPadding}`}>
          <div className="min-h-screen">{children}</div>
        </section>
      </div>
    </div>
  );
}


export default function ShopReelAppShell({ children }: { children: ReactNode }) {
  return <GlobalEnvironmentContinuityProvider><ShellScaffold>{children}</ShellScaffold></GlobalEnvironmentContinuityProvider>;
}
