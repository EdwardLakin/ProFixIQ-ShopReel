import type { AdaptiveProductionAtmosphereState } from "@/features/shopreel/ui/system/adaptiveProductionAtmosphere";
import type { EcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import type { GlobalEnvironmentContinuitySnapshot } from "@/features/shopreel/ui/system/globalEnvironmentContinuity";
import type { OperatorRhythmSnapshot } from "@/features/shopreel/ui/system/operatorRhythm";
import type { StrategicAdaptationSnapshot } from "@/features/shopreel/ui/system/strategicAdaptation";
import type { ProductionExecutionSnapshot } from "@/features/shopreel/ui/system/productionExecutionIntelligence";
import type { WorkflowEmbodimentSnapshot } from "@/features/shopreel/ui/system/workflowEmbodiment";

export type EnvironmentalEmbodimentSnapshot = {
  spatialPersistence: "lifted" | "steady" | "reduced";
  continuityPresence: "anchored" | "visible" | "background";
  unstableCompression: "none" | "mild" | "active";
  exportForwardPull: "idle" | "present" | "leading";
  dormantRecession: "none" | "cooled" | "recessed";
  recoveryBreathingRoom: "tight" | "open" | "wide";
  renderTurbulence: "quiet" | "watch" | "elevated";
  escalationPacing: "calm" | "measured" | "intense";
  stabilizationCalm: "low" | "restoring" | "stable";
  shellDensity: "compact" | "balanced" | "spacious";
  navGravity: "light" | "balanced" | "forward";
  surfaceWeight: "low" | "balanced" | "high";
  transitionPosture: "resuming" | "forward" | "recovery" | "cooled" | "pressured" | "steady";
  terrainDistortion: "none" | "mild" | "visible";
  forwardMotionBias: "neutral" | "guided" | "pulled";
  calmExpansion: "contained" | "settling" | "expanded";
  explanation: string[];
};

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function deriveEnvironmentalEmbodimentSnapshot(args: {
  continuity: GlobalEnvironmentContinuitySnapshot;
  ecosystem: EcosystemStateSnapshot;
  atmosphere: AdaptiveProductionAtmosphereState | null;
  rhythm: OperatorRhythmSnapshot;
  strategic: StrategicAdaptationSnapshot;
  execution: ProductionExecutionSnapshot;
  workflow: WorkflowEmbodimentSnapshot;
  routeContext: string;
}): EnvironmentalEmbodimentSnapshot {
  const continuityPressure = clamp(args.workflow.continuityWeight * 0.55 + (100 - args.ecosystem.continuityHealth) * 0.25 + (args.continuity.routeTransitionMemory.transitionCount > 0 ? 10 : 0));
  const instabilityPressure = clamp(args.workflow.renderPressure * 0.55 + args.continuity.renderInstability * 0.3 + args.execution.blockedChainPressure * 0.15);
  const exportPressure = clamp(args.workflow.exportPull * 0.65 + args.continuity.exportMomentum * 0.35);
  const dormantPressure = clamp(args.continuity.dormantInfluence * 0.7 + (args.atmosphere?.mode === "dormant" ? 24 : 0));
  const recoveryPressure = clamp((args.atmosphere?.recoveryCalm ?? 45) * 0.55 + (args.continuity.recoveryCorridor === "stable" ? 28 : args.continuity.recoveryCorridor === "forming" ? 12 : 0));
  const escalationPressure = clamp((args.continuity.escalationState === "critical" ? 86 : args.continuity.escalationState === "elevated" ? 68 : args.continuity.escalationState === "steady" ? 44 : 24) * 0.65 + instabilityPressure * 0.35);

  const spatialPersistence: EnvironmentalEmbodimentSnapshot["spatialPersistence"] = continuityPressure >= 66 ? "lifted" : continuityPressure >= 46 ? "steady" : "reduced";
  const continuityPresence: EnvironmentalEmbodimentSnapshot["continuityPresence"] = continuityPressure >= 70 || args.workflow.primaryWorkMode === "continuation" ? "anchored" : continuityPressure >= 42 ? "visible" : "background";
  const unstableCompression: EnvironmentalEmbodimentSnapshot["unstableCompression"] = instabilityPressure >= 72 ? "active" : instabilityPressure >= 48 ? "mild" : "none";
  const exportForwardPull: EnvironmentalEmbodimentSnapshot["exportForwardPull"] = exportPressure >= 70 ? "leading" : exportPressure >= 46 ? "present" : "idle";
  const dormantRecession: EnvironmentalEmbodimentSnapshot["dormantRecession"] = dormantPressure >= 72 ? "recessed" : dormantPressure >= 46 ? "cooled" : "none";
  const recoveryBreathingRoom: EnvironmentalEmbodimentSnapshot["recoveryBreathingRoom"] = recoveryPressure >= 74 ? "wide" : recoveryPressure >= 48 ? "open" : "tight";
  const renderTurbulence: EnvironmentalEmbodimentSnapshot["renderTurbulence"] = instabilityPressure >= 74 ? "elevated" : instabilityPressure >= 52 ? "watch" : "quiet";
  const escalationPacing: EnvironmentalEmbodimentSnapshot["escalationPacing"] = escalationPressure >= 72 ? "intense" : escalationPressure >= 46 ? "measured" : "calm";
  const stabilizationCalm: EnvironmentalEmbodimentSnapshot["stabilizationCalm"] = recoveryPressure >= 72 && instabilityPressure < 58 ? "stable" : recoveryPressure >= 50 ? "restoring" : "low";

  const shellDensity: EnvironmentalEmbodimentSnapshot["shellDensity"] = unstableCompression === "active" || args.rhythm.navigationDensity === "dense" ? "compact" : recoveryBreathingRoom === "wide" || dormantRecession === "recessed" ? "spacious" : "balanced";
  const navGravity: EnvironmentalEmbodimentSnapshot["navGravity"] = exportForwardPull === "leading" ? "forward" : dormantRecession === "recessed" ? "light" : "balanced";
  const surfaceWeight: EnvironmentalEmbodimentSnapshot["surfaceWeight"] = spatialPersistence === "lifted" || unstableCompression === "active" ? "high" : dormantRecession === "recessed" ? "low" : "balanced";

  const route = args.routeContext.toLowerCase();
  const transitionPosture: EnvironmentalEmbodimentSnapshot["transitionPosture"] = route.includes("export") || route.includes("publish")
    ? "forward"
    : route.includes("library") && dormantRecession !== "none"
      ? "cooled"
      : args.continuity.recoveryCorridor !== "none"
        ? "recovery"
        : args.workflow.routeTransitionCarryover.toLowerCase().includes("carryover")
          ? "resuming"
          : unstableCompression !== "none"
            ? "pressured"
            : "steady";

  const terrainDistortion: EnvironmentalEmbodimentSnapshot["terrainDistortion"] = args.atmosphere?.continuityDistortion === "visible" || unstableCompression === "active"
    ? "visible"
    : args.atmosphere?.continuityDistortion === "mild" || unstableCompression === "mild"
      ? "mild"
      : "none";
  const forwardMotionBias: EnvironmentalEmbodimentSnapshot["forwardMotionBias"] = exportForwardPull === "leading" || transitionPosture === "forward"
    ? "pulled"
    : exportForwardPull === "present" || transitionPosture === "resuming"
      ? "guided"
      : "neutral";
  const calmExpansion: EnvironmentalEmbodimentSnapshot["calmExpansion"] = recoveryBreathingRoom === "wide" && stabilizationCalm === "stable"
    ? "expanded"
    : recoveryBreathingRoom !== "tight" || stabilizationCalm === "restoring"
      ? "settling"
      : "contained";

  return {
    spatialPersistence,
    continuityPresence,
    unstableCompression,
    exportForwardPull,
    dormantRecession,
    recoveryBreathingRoom,
    renderTurbulence,
    escalationPacing,
    stabilizationCalm,
    shellDensity,
    navGravity,
    surfaceWeight,
    transitionPosture,
    terrainDistortion,
    forwardMotionBias,
    calmExpansion,
    explanation: [
      continuityPresence === "anchored" ? "Continuity pressure is anchoring this surface." : "Continuity pressure is present but controlled.",
      unstableCompression !== "none" ? `Render turbulence is ${unstableCompression === "active" ? "compressing" : "nudging"} surrounding rails.` : "Render rails remain spatially relaxed.",
      exportForwardPull !== "idle" ? "Export momentum is pulling publish actions forward." : "Forward export pull is currently neutral.",
      recoveryBreathingRoom !== "tight" ? "Recovery corridor is widening the workspace." : "Recovery corridor remains contained.",
      dormantRecession !== "none" ? "Dormant branches are cooling into background." : `Route posture remains ${transitionPosture}.`,
    ],
  };
}
