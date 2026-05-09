"use client";

import { useEffect, useMemo, useState } from "react";
import { deriveEcosystemStateSnapshot, readEcosystemStateSnapshot, type EcosystemSurface, type EcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import { readWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { useGlobalEnvironmentContinuity } from "@/features/shopreel/ui/system/GlobalEnvironmentContinuityClient";
import { deriveOperatorAdaptation, readOperatorBehaviorMemory } from "@/features/shopreel/ui/system/operatorBehaviorAdaptation";

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
  const surfaceLead = useMemo(() => `${SURFACE_HINT[surface]} · ${snapshot.atmosphericLabel}`, [snapshot.atmosphericLabel, surface]);

  return (
    <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 px-3 py-2.5 text-xs text-cyan-50/95">
      <div className="uppercase tracking-[0.16em] text-cyan-100/75">{surfaceLead}</div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-cyan-50/90">
        <span>Production pressure {snapshot.operationalPressure}</span>
        <span>Continuity {snapshot.continuityHealth}</span>
        <span>Render readiness {Math.max(0, 100 - snapshot.renderPressure)}</span>
        <span>Export momentum {snapshot.exportMomentum}</span>
      </div>
      <div className="mt-1 text-cyan-100/80">World {continuity.continuousEvolution?.productionWorldMode ?? "stable"} · atmosphere {continuity.adaptiveAtmosphere?.mode ?? "calm"} · escalation {continuity.escalationState}</div>
      <div className="mt-1 text-cyan-100/80">Momentum {continuity.continuousEvolution?.exportMomentumPersistence ?? continuity.exportMomentum} · recovery {continuity.recoveryCorridor} · nav cooling {continuity.continuousEvolution?.dormantNavigationCooling ?? continuity.dormantInfluence}</div>
      <div className="mt-1 text-cyan-100/80">Operator bias: {operator.priorityBias === "export" ? "export momentum" : operator.priorityBias === "recovery" ? "recovery-first" : operator.priorityBias === "campaign" ? "campaign strategy" : operator.priorityBias === "continuity" ? "continuity restoration" : `${operator.priorityBias} rhythm`}</div>
      <div className="mt-1 text-cyan-100/80">Next environmental adjustment: density {continuity.continuousEvolution?.globalDensityBias ?? "neutral"}, hierarchy {continuity.continuousEvolution?.globalHierarchyBias ?? "neutral"}</div>
      <div className="mt-1 text-cyan-100/70">{continuity.continuousEvolution?.explanation ?? continuity.explainability[0]}</div>
    </div>
  );
}
