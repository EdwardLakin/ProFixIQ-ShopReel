"use client";

import { useMemo } from "react";
import { deriveEcosystemStateSnapshot, type EcosystemSurface } from "@/features/shopreel/ui/system/ecosystemState";
import { readWorkspaceMemory, type WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { useGlobalEnvironmentContinuity } from "@/features/shopreel/ui/system/GlobalEnvironmentContinuityClient";
import { deriveOperatorRhythmSnapshot } from "@/features/shopreel/ui/system/operatorRhythm";
import { deriveProductionIntuition } from "@/features/shopreel/ui/system/productionIntuition";
import { deriveProductionExecutionIntelligence } from "@/features/shopreel/ui/system/productionExecutionIntelligence";
import { deriveWorkflowEmbodimentSnapshot } from "@/features/shopreel/ui/system/workflowEmbodiment";
import { deriveEnvironmentalEmbodimentSnapshot } from "@/features/shopreel/ui/system/environmentalEmbodiment";
import { deriveStrategicAdaptation, readStrategicOperationalMemory } from "@/features/shopreel/ui/system/strategicAdaptation";
import { readOperatorBehaviorMemory } from "@/features/shopreel/ui/system/operatorBehaviorAdaptation";

export default function SurfaceExecutionHint({ surface }: { surface: EcosystemSurface }) {
  const continuity = useGlobalEnvironmentContinuity();
  const memory = readWorkspaceMemory();
  const operator = readOperatorBehaviorMemory();
  const snapshot = deriveEcosystemStateSnapshot(memory);
  const rhythm = deriveOperatorRhythmSnapshot();
  const intuition = deriveProductionIntuition({ operator, continuity, evolution: continuity.continuousEvolution, memory, routePathname: continuity.routeTransitionMemory.currentRoute });
  const strategic = deriveStrategicAdaptation({ workspace: memory as WorkspaceMemory | null, operator, continuity, strategicMemory: readStrategicOperationalMemory() });
  const execution = deriveProductionExecutionIntelligence({ ecosystem: snapshot, continuity, rhythm, intuition, strategic, routePath: continuity.routeTransitionMemory.currentRoute });
  const embodiment = deriveWorkflowEmbodimentSnapshot({ surface, ecosystem: snapshot, continuity, rhythm, intuition, strategic, execution });
  const environment = deriveEnvironmentalEmbodimentSnapshot({ continuity, ecosystem: snapshot, atmosphere: continuity.adaptiveAtmosphere, rhythm, strategic, execution, workflow: embodiment, routeContext: continuity.routeTransitionMemory.currentRoute });

  const line = useMemo(() => {
    if (surface === "create") return embodiment.nextWorkflowPosture === "Continue interrupted creation" ? "Continue interrupted creation" : "Stabilize production branch";
    if (surface === "render") return "Resolve render blocker";
    if (surface === "publish") return embodiment.exportPull >= 56 ? "Package ready assets" : "Continue interrupted export";
    if (surface === "review") return "Review continuity gap";
    if (surface === "campaigns") return "Return to campaign lineage";
    if (surface === "editor") return "Stabilize production branch";
    return embodiment.nextWorkflowPosture;
  }, [embodiment, surface]);

  return <div className={`rounded-xl border px-3 py-2 text-xs ${environment.unstableCompression === "active" ? "border-rose-300/25 bg-rose-500/10 text-rose-50/85" : environment.recoveryBreathingRoom === "wide" ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-50/85" : "border-white/10 bg-white/[0.03] text-white/78"}`}>{line} · {environment.transitionPosture} · {environment.shellDensity}</div>;
}
