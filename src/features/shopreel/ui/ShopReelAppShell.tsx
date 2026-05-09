"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import ShopReelSidebar from "@/features/shopreel/ui/ShopReelSidebar";
import GlobalCommandLauncher from "@/features/shopreel/ui/GlobalCommandLauncher";
import { GlobalEnvironmentAmbientLine, GlobalEnvironmentContinuityProvider, useGlobalEnvironmentContinuity } from "@/features/shopreel/ui/system/GlobalEnvironmentContinuityClient";
import { deriveOperatorAdaptation, readOperatorBehaviorMemory } from "@/features/shopreel/ui/system/operatorBehaviorAdaptation";
import { deriveProductionIntuition } from "@/features/shopreel/ui/system/productionIntuition";
import { readWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { usePathname } from "next/navigation";
import { deriveOperatorRhythmSnapshot, recordOperatorRhythmEvent } from "@/features/shopreel/ui/system/operatorRhythm";
import { deriveStrategicAdaptation, readStrategicOperationalMemory } from "@/features/shopreel/ui/system/strategicAdaptation";
import { deriveEcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import { deriveProductionExecutionIntelligence } from "@/features/shopreel/ui/system/productionExecutionIntelligence";
import { deriveWorkflowEmbodimentSnapshot } from "@/features/shopreel/ui/system/workflowEmbodiment";
import { deriveEnvironmentalEmbodimentSnapshot } from "@/features/shopreel/ui/system/environmentalEmbodiment";

function ShellScaffold({ children }: { children: ReactNode }) {
  const continuity = useGlobalEnvironmentContinuity();
  const pathname = usePathname();
  const rhythm = deriveOperatorRhythmSnapshot();
  const atmosphere = continuity.adaptiveAtmosphere;
  const evolution = continuity.continuousEvolution;
  const densityClass = atmosphere?.friction === "high" ? "opacity-[0.05]" : atmosphere?.friction === "visible" ? "opacity-[0.04]" : atmosphere?.friction === "subtle" ? "opacity-[0.03]" : "opacity-[0.015]";
  const energyOpacity = atmosphere?.mode === "recovery" ? "0.12" : atmosphere?.mode === "export_momentum" ? "0.23" : atmosphere?.mode === "render_pressure" || atmosphere?.mode === "fractured" ? "0.26" : "0.18";
  const typography = evolution?.globalHierarchyBias === "elevated" || atmosphere?.hierarchy === "urgent" ? "text-white" : atmosphere?.hierarchy === "sharp" ? "text-slate-50" : "text-slate-100";
  const workspace = readWorkspaceMemory();
  const operatorMemory = readOperatorBehaviorMemory();
  const intuition = deriveProductionIntuition({ operator: operatorMemory, continuity, evolution: continuity.continuousEvolution, memory: workspace, routePathname: pathname });
  const strategic = deriveStrategicAdaptation({ workspace, operator: operatorMemory, continuity, strategicMemory: readStrategicOperationalMemory() });
  const ecosystem = deriveEcosystemStateSnapshot(workspace);
  const execution = deriveProductionExecutionIntelligence({ ecosystem, continuity, rhythm, intuition, strategic, routePath: pathname });
  const workflow = deriveWorkflowEmbodimentSnapshot({ surface: pathname.includes("/render") ? "render" : pathname.includes("/publish") || pathname.includes("/export") ? "publish" : pathname.includes("/review") ? "review" : pathname.includes("/campaign") ? "campaigns" : pathname.includes("/library") ? "library" : pathname.includes("/editor") ? "editor" : pathname.includes("/create") ? "create" : "home", ecosystem, continuity, rhythm, intuition, strategic, execution });
  const embodiment = deriveEnvironmentalEmbodimentSnapshot({ continuity, ecosystem, atmosphere, rhythm, strategic, execution, workflow, routeContext: pathname });
  const shellPadding = embodiment.shellDensity === "compact" ? "pl-2 md:pl-4" : embodiment.shellDensity === "spacious" ? "pl-5 md:pl-8" : rhythm.navigationDensity === "dense" ? "pl-2 md:pl-4" : rhythm.navigationDensity === "sparse" ? "pl-5 md:pl-7" : evolution?.globalDensityBias === "elevated" || atmosphere?.density === "compressed" ? "pl-2 md:pl-4" : evolution?.globalDensityBias === "reduced" ? "pl-4 md:pl-7" : atmosphere?.density === "compact" ? "pl-3 md:pl-5" : "pl-4 md:pl-6";
  const navProminence = embodiment.navGravity === "forward" ? "opacity-95" : embodiment.navGravity === "light" ? "opacity-65" : rhythm.workingMode === "exploratory" ? "opacity-95" : evolution?.globalNavigationBias === "reduced" || atmosphere?.mode === "dormant" ? "opacity-70" : "opacity-90";
  const railEmphasis = embodiment.surfaceWeight === "high" ? "ring-1 ring-cyan-300/30" : embodiment.renderTurbulence === "elevated" ? "ring-1 ring-rose-300/28" : embodiment.dormantRecession === "recessed" ? "ring-1 ring-slate-400/15" : strategic.continuityVisibilityBias === "elevated" ? "ring-1 ring-cyan-300/35" : evolution?.globalFrictionBias === "elevated" || atmosphere?.mode === "render_pressure" ? "ring-1 ring-rose-300/30" : atmosphere?.mode === "export_momentum" ? "ring-1 ring-cyan-300/25" : "";
  const operator = deriveOperatorAdaptation(readOperatorBehaviorMemory(), continuity);
  const navModeClass = strategic.shellDensityBias === "dense" || operator.densityPreference === "compressed" ? "[&_a]:py-1.5" : strategic.shellDensityBias === "calm" || operator.densityPreference === "spacious" ? "[&_a]:py-3" : "[&_a]:py-2";
  const navBiasClass = strategic.commandOrderingBias === "render" ? "[&_a[data-nav=render]]:text-cyan-100" : strategic.commandOrderingBias === "export" || operator.priorityBias === "export" ? "[&_a[data-nav=publish]]:text-cyan-100" : strategic.commandOrderingBias === "recovery" || operator.priorityBias === "recovery" ? "[&_a[data-nav=review]]:text-cyan-100" : operator.priorityBias === "campaign" ? "[&_a[data-nav=campaign]]:text-cyan-100" : "";
  const intuitionNavBias = intuition.suggestedSurface.includes("/publish")
    ? "[&_a[data-nav=publish]]:underline"
    : intuition.suggestedSurface.includes("/render")
      ? "[&_a[data-nav=render]]:underline"
      : intuition.suggestedSurface.includes("/campaign")
        ? "[&_a[data-nav=campaign]]:underline"
        : intuition.suggestedSurface.includes("/review")
          ? "[&_a[data-nav=review]]:underline"
          : "";
  useEffect(() => {
    recordOperatorRhythmEvent({ type: "route_changed", route: pathname });
  }, [pathname]);

  return (
    <div className={`min-h-screen bg-[#02040c] ${typography}`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,.12),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(34,211,238,.1),transparent_32%),linear-gradient(180deg,#050816_0%,#02040c_62%,#01020a_100%)]" style={{ opacity: Number(energyOpacity) + (evolution?.globalAtmosphereBias === "elevated" ? 0.02 : evolution?.globalRecoveryBias === "elevated" ? -0.03 : 0) }} />
        <div className={`absolute inset-0 ${densityClass} [background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:48px_48px]`} />
      </div>

      <div className={`relative flex min-h-screen ${railEmphasis}`}>
        <div className={`${navProminence} ${navModeClass} ${navBiasClass} ${intuitionNavBias}`}><ShopReelSidebar /></div>
        <GlobalCommandLauncher />
        <GlobalEnvironmentAmbientLine />

        <section className={`relative min-w-0 flex-1 ${shellPadding} ${embodiment.recoveryBreathingRoom === "wide" ? "pt-1" : embodiment.unstableCompression === "active" ? "pt-0" : ""}`}>
          <div className={`min-h-screen ${embodiment.transitionPosture === "forward" ? "[&_*]:transition-all" : ""}`}>{children}</div>
        </section>
      </div>
    </div>
  );
}


export default function ShopReelAppShell({ children }: { children: ReactNode }) {
  return <GlobalEnvironmentContinuityProvider><ShellScaffold>{children}</ShellScaffold></GlobalEnvironmentContinuityProvider>;
}
