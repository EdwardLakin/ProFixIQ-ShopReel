"use client";

import { useMemo } from "react";
import { deriveEcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import { readWorkspaceMemory, type WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { useGlobalEnvironmentContinuity } from "@/features/shopreel/ui/system/GlobalEnvironmentContinuityClient";
import { deriveOperatorRhythmSnapshot } from "@/features/shopreel/ui/system/operatorRhythm";
import { deriveProductionIntuition } from "@/features/shopreel/ui/system/productionIntuition";
import { deriveProductionExecutionIntelligence } from "@/features/shopreel/ui/system/productionExecutionIntelligence";
import { deriveStrategicAdaptation, readStrategicOperationalMemory } from "@/features/shopreel/ui/system/strategicAdaptation";
import { readOperatorBehaviorMemory } from "@/features/shopreel/ui/system/operatorBehaviorAdaptation";

export default function SurfaceExecutionHint({ surface }: { surface: string }) {
  const continuity = useGlobalEnvironmentContinuity();
  const memory = readWorkspaceMemory();
  const operator = readOperatorBehaviorMemory();
  const snapshot = deriveEcosystemStateSnapshot(memory);
  const rhythm = deriveOperatorRhythmSnapshot();
  const intuition = deriveProductionIntuition({ operator, continuity, evolution: continuity.continuousEvolution, memory, routePathname: continuity.routeTransitionMemory.currentRoute });
  const strategic = deriveStrategicAdaptation({ workspace: memory as WorkspaceMemory | null, operator, continuity, strategicMemory: readStrategicOperationalMemory() });
  const execution = deriveProductionExecutionIntelligence({ ecosystem: snapshot, continuity, rhythm, intuition, strategic, routePath: continuity.routeTransitionMemory.currentRoute });

  const line = useMemo(() => {
    if (surface === "create" && execution.recommendedSurface !== "/shopreel/create") return "Continue before creating: active continuity chain is ahead of new draft creation.";
    if (surface === "render") return `Render urgency elevated by blocked chain + recent operator rhythm (${rhythm.cadence}).`;
    if (surface === "publish") return "Manual operator review stays authoritative; export-ready packages are prioritized first.";
    if (surface === "review") return "This review matters now because unresolved continuity pressure is still active.";
    if (surface === "campaigns") return execution.campaignLineageBias >= 60 ? "Campaign lineage is continuity-critical right now." : "Campaign lanes are cooling; keep lineage visible while stabilizing.";
    if (surface === "editor") return `Active branch: ${execution.recommendedSurface.replace('/shopreel/', '')} with continuity route priority ${execution.routeContinuityPriority}.`;
    return execution.explanation[0];
  }, [execution, rhythm.cadence, surface]);

  return <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/78">{line}</div>;
}
