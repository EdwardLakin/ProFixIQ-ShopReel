"use client";

import { useEffect, useMemo, useState } from "react";
import { deriveEcosystemStateSnapshot, readEcosystemStateSnapshot, type EcosystemSurface, type EcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import { readWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { useGlobalEnvironmentContinuity } from "@/features/shopreel/ui/system/GlobalEnvironmentContinuityClient";
import { deriveProductionIntuition } from "@/features/shopreel/ui/system/productionIntuition";
import { deriveOperatorRhythmSnapshot } from "@/features/shopreel/ui/system/operatorRhythm";
import { deriveStrategicAdaptation, readStrategicOperationalMemory } from "@/features/shopreel/ui/system/strategicAdaptation";
import { deriveProductionExecutionIntelligence } from "@/features/shopreel/ui/system/productionExecutionIntelligence";
import { deriveWorkflowEmbodimentSnapshot } from "@/features/shopreel/ui/system/workflowEmbodiment";
import { deriveEnvironmentalEmbodimentSnapshot } from "@/features/shopreel/ui/system/environmentalEmbodiment";
import { readOperatorBehaviorMemory } from "@/features/shopreel/ui/system/operatorBehaviorAdaptation";

const SURFACE_HINT: Record<EcosystemSurface, string> = {
  home: "Ecosystem state",
  create: "Create flow continuity",
  campaigns: "Campaign continuity",
  render: "Render readiness",
  publish: "Export momentum",
  library: "Recovery path",
  review: "Review risk",
  editor: "Next operational move",
};

export default function EcosystemStateRail({ surface }: { surface: EcosystemSurface }) {
  const [snapshot, setSnapshot] = useState<EcosystemStateSnapshot>(readEcosystemStateSnapshot());
  const continuity = useGlobalEnvironmentContinuity();

  useEffect(() => {
    const update = () => setSnapshot(deriveEcosystemStateSnapshot(readWorkspaceMemory()));
    update();
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, []);

  const rhythm = useMemo(() => deriveOperatorRhythmSnapshot(), [continuity.routeTransitionMemory.currentRoute, continuity.routeTransitionMemory.transitionCount]);
  const intuition = useMemo(() => deriveProductionIntuition({
    operator: readOperatorBehaviorMemory(),
    continuity,
    evolution: continuity.continuousEvolution,
    memory: readWorkspaceMemory(),
    routePathname: continuity.routeTransitionMemory.currentRoute,
  }), [continuity]);
  const strategic = useMemo(() => deriveStrategicAdaptation({
    workspace: readWorkspaceMemory(),
    operator: readOperatorBehaviorMemory(),
    continuity,
    strategicMemory: readStrategicOperationalMemory(),
  }), [continuity]);
  const execution = useMemo(() => deriveProductionExecutionIntelligence({ ecosystem: snapshot, continuity, rhythm, intuition, strategic, routePath: continuity.routeTransitionMemory.currentRoute }), [continuity, intuition, rhythm, snapshot, strategic]);
  const embodiment = useMemo(() => deriveWorkflowEmbodimentSnapshot({ surface, ecosystem: snapshot, continuity, rhythm, intuition, strategic, execution }), [continuity, execution, intuition, rhythm, snapshot, strategic, surface]);
  const environment = useMemo(() => deriveEnvironmentalEmbodimentSnapshot({ continuity, ecosystem: snapshot, atmosphere: continuity.adaptiveAtmosphere, rhythm, strategic, execution, workflow: embodiment, routeContext: continuity.routeTransitionMemory.currentRoute }), [continuity, embodiment, execution, rhythm, snapshot, strategic]);
  const surfaceLead = useMemo(() => `${SURFACE_HINT[surface]} · ${environment.transitionPosture}`, [environment.transitionPosture, surface]);

  return (
    <div className={`rounded-2xl border px-3 py-2 text-xs ${environment.unstableCompression === "active" ? "border-rose-300/30 bg-rose-500/10 text-rose-50/90" : environment.exportForwardPull === "leading" ? "border-cyan-300/30 bg-cyan-500/10 text-cyan-50/95" : "border-white/15 bg-white/[0.04] text-white/85"}`}>
      <div className="uppercase tracking-[0.16em] text-white/65">{surfaceLead}</div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-white/78">
        <span>Presence {environment.continuityPresence}</span>
        <span>Density {environment.shellDensity}</span>
        <span>Pull {environment.exportForwardPull}</span>
        <span>Calm {environment.stabilizationCalm}</span>
      </div>
      <div className="mt-1 text-white/70">{embodiment.nextWorkflowPosture} · {environment.transitionPosture}</div>
      <div className="mt-1 text-white/60">{environment.explanation[0]}</div>
    </div>
  );
}
