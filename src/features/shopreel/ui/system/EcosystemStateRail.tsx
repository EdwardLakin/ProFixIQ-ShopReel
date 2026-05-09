"use client";

import { useEffect, useMemo, useState } from "react";
import { deriveEcosystemStateSnapshot, readEcosystemStateSnapshot, type EcosystemSurface, type EcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import { readWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { useGlobalEnvironmentContinuity } from "@/features/shopreel/ui/system/GlobalEnvironmentContinuityClient";
import { deriveOperatorAdaptation, readOperatorBehaviorMemory } from "@/features/shopreel/ui/system/operatorBehaviorAdaptation";
import { deriveProductionIntuition } from "@/features/shopreel/ui/system/productionIntuition";
import { deriveOperatorRhythmSnapshot } from "@/features/shopreel/ui/system/operatorRhythm";
import { deriveStrategicAdaptation, readStrategicOperationalMemory } from "@/features/shopreel/ui/system/strategicAdaptation";
import { deriveProductionExecutionIntelligence } from "@/features/shopreel/ui/system/productionExecutionIntelligence";

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

  const operator = useMemo(() => deriveOperatorAdaptation(readOperatorBehaviorMemory(), continuity), [continuity]);
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
  const execution = useMemo(() => deriveProductionExecutionIntelligence({
    ecosystem: snapshot,
    continuity,
    rhythm,
    intuition,
    strategic,
    routePath: continuity.routeTransitionMemory.currentRoute,
  }), [continuity, intuition, rhythm, snapshot, strategic]);
  const surfaceLead = useMemo(() => `${SURFACE_HINT[surface]} · ${snapshot.atmosphericLabel}`, [snapshot.atmosphericLabel, surface]);
  const nextMove = execution.nextOperationalMove || intuition.suggestedCommand || snapshot.suggestedSurfaceAction;

  return (
    <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 px-3 py-2.5 text-xs text-cyan-50/95">
      <div className="uppercase tracking-[0.16em] text-cyan-100/75">{surfaceLead}</div>
      <div className="mt-1.5 grid gap-1 text-cyan-50/90 sm:grid-cols-2">
        <span>Production pressure {snapshot.operationalPressure}</span>
        <span>Continuity {snapshot.continuityHealth}</span>
        <span>Render readiness {Math.max(0, 100 - snapshot.renderPressure)}</span>
        <span>Export momentum {snapshot.exportMomentum}</span>
      </div>
      <div className="mt-2 rounded-lg bg-black/20 px-2.5 py-1.5 text-cyan-100/90">Next move: {nextMove} → {intuition.suggestedSurface}</div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-cyan-100/75">
        <span>Recovery path {continuity.recoveryCorridor}</span>
        <span>Rhythm {rhythm.cadence}</span>
        <span>Bias {operator.priorityBias}</span>
      </div>
      <div className="mt-1 text-cyan-100/65">{continuity.continuousEvolution?.explanation ?? continuity.explainability[0]}</div>
      <div className="mt-1 text-cyan-100/70">Execution: {execution.explanation[0]}</div>
      <div className="mt-1 text-cyan-100/70">Continuity trail: {continuity.routeTransitionMemory.previousRoute} → {continuity.routeTransitionMemory.currentRoute}</div>
    </div>
  );
}
