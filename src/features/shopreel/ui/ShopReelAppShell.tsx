import type { ReactNode } from "react";
import ShopReelSidebar from "@/features/shopreel/ui/ShopReelSidebar";
import GlobalCommandLauncher from "@/features/shopreel/ui/GlobalCommandLauncher";
import { GlobalEnvironmentAmbientLine, GlobalEnvironmentContinuityProvider, useGlobalEnvironmentContinuity } from "@/features/shopreel/ui/system/GlobalEnvironmentContinuityClient";

function ShellScaffold({ children }: { children: ReactNode }) {
  const continuity = useGlobalEnvironmentContinuity();
  const densityClass = continuity.dormantInfluence >= 62 ? "opacity-[0.02]" : continuity.renderInstability >= 60 ? "opacity-[0.06]" : "opacity-[0.04]";
  const energyOpacity = continuity.recoveryCorridor === "stable" ? "0.12" : continuity.renderInstability >= 65 ? "0.22" : "0.18";

  return (
    <div className="min-h-screen bg-[#02040c] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,.18),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(34,211,238,.14),transparent_32%),linear-gradient(180deg,#050816_0%,#02040c_62%,#01020a_100%)]" style={{ opacity: Number(energyOpacity) }} />
        <div className={`absolute inset-0 ${densityClass} [background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:48px_48px]`} />
      </div>

      <div className="relative flex min-h-screen">
        <ShopReelSidebar />
        <GlobalCommandLauncher />
        <GlobalEnvironmentAmbientLine />

        <section className="relative min-w-0 flex-1 pl-4 md:pl-6">
          <div className="min-h-screen">{children}</div>
        </section>
      </div>
    </div>
  );
}


export default function ShopReelAppShell({ children }: { children: ReactNode }) {
  return <GlobalEnvironmentContinuityProvider><ShellScaffold>{children}</ShellScaffold></GlobalEnvironmentContinuityProvider>;
}
