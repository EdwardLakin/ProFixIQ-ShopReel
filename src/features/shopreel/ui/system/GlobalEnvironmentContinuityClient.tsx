"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { deriveEcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import { readWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { deriveGlobalEnvironmentContinuity, persistGlobalEnvironmentContinuity, type GlobalEnvironmentContinuitySnapshot } from "@/features/shopreel/ui/system/globalEnvironmentContinuity";
import { deriveAdaptiveProductionAtmosphere } from "@/features/shopreel/ui/system/adaptiveProductionAtmosphere";
import { deriveContinuousEcosystemEvolution, persistContinuousEcosystemRouteMemory } from "@/features/shopreel/ui/system/continuousEcosystemEvolution";
import { deriveOperatorAdaptation, readOperatorBehaviorMemory, recordOperatorBehaviorEvent } from "@/features/shopreel/ui/system/operatorBehaviorAdaptation";

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
    const behaviorMemory = readOperatorBehaviorMemory();
    const hadPriorActivity = behaviorMemory.recentEvents.length > 0;
    const dormantHours = hadPriorActivity ? (Date.now() - new Date(behaviorMemory.lastActiveAt).getTime()) / 3600000 : 0;
    if (hadPriorActivity && dormantHours > 18) recordOperatorBehaviorEvent({ type: "dormant_return", route: pathname });
    recordOperatorBehaviorEvent({ type: "route_changed", route: pathname });
    const operatorAdaptation = deriveOperatorAdaptation(readOperatorBehaviorMemory(), continuitySnapshot);
    const adaptiveAtmosphere = deriveAdaptiveProductionAtmosphere({ continuity: continuitySnapshot, ecosystem, memory, routeContext: pathname, previous: snapshot.adaptiveAtmosphere });
    const evolved = deriveContinuousEcosystemEvolution({ continuity: continuitySnapshot, ecosystem, atmosphere: adaptiveAtmosphere, memory, routeContext: pathname });
    const nextSnapshot = { ...continuitySnapshot, adaptiveAtmosphere, continuousEvolution: evolved.state, routeTransitionMemory: { ...continuitySnapshot.routeTransitionMemory, lastMode: adaptiveAtmosphere.mode, lastDensity: adaptiveAtmosphere.density, lastRhythm: adaptiveAtmosphere.rhythm, lastFocus: `${adaptiveAtmosphere.activeFocusLabel} · ${operatorAdaptation.operatorMode.replace("_", " ")}` }, explainability: [...continuitySnapshot.explainability, ...operatorAdaptation.explanation].slice(0, 6) };
    setSnapshot(nextSnapshot);
    persistGlobalEnvironmentContinuity(nextSnapshot, pathname);
    persistContinuousEcosystemRouteMemory(evolved.routeMemory);
  }, [pathname]);

  return <ContinuityContext.Provider value={useMemo(() => snapshot, [snapshot])}>{children}</ContinuityContext.Provider>;
}
export function useGlobalEnvironmentContinuity(): GlobalEnvironmentContinuitySnapshot { return useContext(ContinuityContext); }

export function GlobalEnvironmentAmbientLine() {
  const continuity = useGlobalEnvironmentContinuity();
  const issueTone = continuity.renderInstability >= 70 || continuity.continuityFracture >= 70;
  const message = issueTone ? "Needs attention" : "Active path";
  const detail = continuity.adaptiveAtmosphere?.activeFocusLabel ?? "steady progress";
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white/80">
      <span className="font-medium">{message}:</span> {detail}
    </div>
  );
}
