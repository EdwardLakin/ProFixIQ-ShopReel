"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { deriveEcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import { readWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { deriveGlobalEnvironmentContinuity, persistGlobalEnvironmentContinuity, type GlobalEnvironmentContinuitySnapshot } from "@/features/shopreel/ui/system/globalEnvironmentContinuity";
import { deriveAdaptiveProductionAtmosphere } from "@/features/shopreel/ui/system/adaptiveProductionAtmosphere";
import { deriveContinuousEcosystemEvolution, persistContinuousEcosystemRouteMemory } from "@/features/shopreel/ui/system/continuousEcosystemEvolution";

const fallbackSnapshot: GlobalEnvironmentContinuitySnapshot = {
  atmosphericContinuity: "calm continuity",
  escalationState: "calm",
  exportMomentum: 24,
  continuityFracture: 20,
  renderInstability: 18,
  dormantInfluence: 28,
  recoveryCorridor: "stable",
  routeTransitionMemory: { previousRoute: "/shopreel", currentRoute: "/shopreel", transitionCount: 0, lastMode: "calm", lastDensity: "open", lastRhythm: "breathing", lastFocus: "shopreel workflow focus" },
  adaptiveAtmosphere: null,
  globalEnvironmentTone: "calm_continuity",
  explainability: ["No workspace memory yet, running safe deterministic defaults."],
  continuousEvolution: null,
};

const ContinuityContext = createContext<GlobalEnvironmentContinuitySnapshot>(fallbackSnapshot);

export function GlobalEnvironmentContinuityProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [snapshot, setSnapshot] = useState<GlobalEnvironmentContinuitySnapshot>(fallbackSnapshot);

  useEffect(() => {
    const memory = readWorkspaceMemory();
    const ecosystem = deriveEcosystemStateSnapshot(memory);
    const continuitySnapshot = deriveGlobalEnvironmentContinuity({ memory, ecosystem, routeContext: pathname });
    const adaptiveAtmosphere = deriveAdaptiveProductionAtmosphere({ continuity: continuitySnapshot, ecosystem, memory, routeContext: pathname, previous: snapshot.adaptiveAtmosphere });
    const evolved = deriveContinuousEcosystemEvolution({ continuity: continuitySnapshot, ecosystem, atmosphere: adaptiveAtmosphere, memory, routeContext: pathname });
    const nextSnapshot = { ...continuitySnapshot, adaptiveAtmosphere, continuousEvolution: evolved.state, routeTransitionMemory: { ...continuitySnapshot.routeTransitionMemory, lastMode: adaptiveAtmosphere.mode, lastDensity: adaptiveAtmosphere.density, lastRhythm: adaptiveAtmosphere.rhythm, lastFocus: adaptiveAtmosphere.activeFocusLabel } };
    setSnapshot(nextSnapshot);
    persistGlobalEnvironmentContinuity(nextSnapshot, pathname);
    persistContinuousEcosystemRouteMemory(evolved.routeMemory);
  }, [pathname]);

  const value = useMemo(() => snapshot, [snapshot]);
  return <ContinuityContext.Provider value={value}>{children}</ContinuityContext.Provider>;
}

export function useGlobalEnvironmentContinuity(): GlobalEnvironmentContinuitySnapshot {
  return useContext(ContinuityContext);
}

export function GlobalEnvironmentAmbientLine() {
  const continuity = useGlobalEnvironmentContinuity();
  return (
    <div className="pointer-events-none fixed left-3 right-3 top-14 z-30 md:left-[290px]">
      <div className="rounded-full border border-cyan-300/20 bg-slate-900/55 px-3 py-1 text-[11px] text-cyan-100/75 backdrop-blur">
        {continuity.continuousEvolution ? `World ${continuity.continuousEvolution.productionWorldMode} · atmosphere ${continuity.adaptiveAtmosphere?.mode.replace("_", " ") ?? "calm"} · escalation ${continuity.escalationState} · export ${continuity.continuousEvolution.exportMomentumPersistence}` : continuity.adaptiveAtmosphere ? `${continuity.adaptiveAtmosphere.mode.replace("_", " ")} · ${continuity.adaptiveAtmosphere.activeFocusLabel} · ${continuity.adaptiveAtmosphere.density} spacing` : `Production atmosphere: ${continuity.atmosphericContinuity}`}
      </div>
    </div>
  );
}
