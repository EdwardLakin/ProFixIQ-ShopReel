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
import { deriveSpatialWorkspaceBehaviorSnapshot } from "@/features/shopreel/ui/system/spatialWorkspaceBehavior";
import { readOperatorBehaviorMemory } from "@/features/shopreel/ui/system/operatorBehaviorAdaptation";

const SURFACE_HINT: Record<EcosystemSurface, string> = {
  home: "Continuity",
  create: "Active path",
  campaigns: "Campaign path",
  render: "Render pressure",
  publish: "Export path",
  library: "Recovery path",
  review: "Ready check",
  editor: "Next move",
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
  const spatial = useMemo(() => deriveSpatialWorkspaceBehaviorSnapshot({ continuity, evolution: continuity.continuousEvolution, atmosphere: continuity.adaptiveAtmosphere, rhythm, strategic, execution, workflow: embodiment, embodiment: environment, routeContext: continuity.routeTransitionMemory.currentRoute }), [continuity, embodiment, environment, execution, rhythm, strategic]);
  const surfaceLead = useMemo(() => `${SURFACE_HINT[surface]} · ${environment.transitionPosture}`, [environment.transitionPosture, surface]);
  const compact = environment.unstableCompression === "active" || spatial.lanePosture === "compact";
  const calm = environment.transitionPosture === "cooled" || environment.dormantRecession === "recessed" || spatial.spatialPriority === "waiting";

  return (
    <div className={`rounded-2xl border text-xs transition-[padding,opacity,background-color,border-color] duration-300 ${compact ? "px-2.5 py-1.5" : environment.recoveryBreathingRoom === "wide" ? "px-4 py-3" : "px-3 py-2"} ${compact ? "border-rose-300/30 bg-rose-500/10 text-rose-50/90" : environment.exportForwardPull === "leading" ? "border-cyan-300/30 bg-cyan-500/10 text-cyan-50/95" : environment.dormantRecession === "recessed" ? "border-slate-300/10 bg-slate-500/[0.06] text-white/65" : "border-white/15 bg-white/[0.04] text-white/85"}`}>
      <div className="uppercase tracking-[0.16em] text-white/65">{surfaceLead} · {spatial.spatialPriority.replaceAll("_", " ")}</div>
      <div className={`mt-1.5 flex flex-wrap text-white/78 transition-all duration-300 ${compact ? "gap-x-2 gap-y-0.5" : environment.recoveryBreathingRoom === "wide" ? "gap-x-4 gap-y-1.5" : "gap-x-3 gap-y-1"}`}>
        <span>Active path {environment.continuityPresence}</span>
        <span>Stable {spatial.workspaceDensity}</span>
        {!calm ? <span>Ready to publish {environment.exportForwardPull}</span> : null}
        {!compact && !calm ? <span>Recovery {environment.stabilizationCalm}</span> : null}
      </div>
      <div className="mt-1 text-white/70">{embodiment.nextWorkflowPosture} · {spatial.activeTerrainMode.replaceAll("_", " ")}</div>
      {!compact && !calm ? <div className="mt-1 text-white/60">{environment.explanation[1] ?? environment.explanation[0]}</div> : null}
    </div>
  );
}
