import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import type { EcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import type { GlobalEnvironmentContinuitySnapshot } from "@/features/shopreel/ui/system/globalEnvironmentContinuity";

export type AdaptiveAtmosphereMode = "calm" | "active" | "escalating" | "export_momentum" | "render_pressure" | "recovery" | "dormant" | "fractured";
export type AdaptiveAtmosphereRhythm = "breathing" | "focused" | "compressed" | "directional" | "stabilizing" | "cooling";
export type AdaptiveAtmosphereDensity = "open" | "normal" | "compact" | "compressed";
export type AdaptiveAtmosphereFriction = "none" | "subtle" | "visible" | "high";

export type AdaptiveProductionAtmosphereState = {
  mode: AdaptiveAtmosphereMode;
  rhythm: AdaptiveAtmosphereRhythm;
  density: AdaptiveAtmosphereDensity;
  hierarchy: "soft" | "normal" | "sharp" | "urgent";
  friction: AdaptiveAtmosphereFriction;
  continuityDistortion: "none" | "mild" | "visible";
  exportEmphasis: number;
  renderTension: number;
  recoveryCalm: number;
  productionFatigue: number;
  activeFocusLabel: string;
  conciseReadout: string;
  conciseExplainability: string[];
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function deriveAdaptiveProductionAtmosphere(args: {
  continuity: GlobalEnvironmentContinuitySnapshot;
  ecosystem: EcosystemStateSnapshot;
  memory: WorkspaceMemory | null;
  routeContext: string;
  previous?: AdaptiveProductionAtmosphereState | null;
}): AdaptiveProductionAtmosphereState {
  const blockers = args.memory?.pendingTasks.filter((task) => !task.done && /render|review|verify|publish/i.test(task.label)).length ?? 0;
  const unresolved = args.memory?.pendingTasks.filter((task) => !task.done).length ?? 0;
  const fatigue = clamp((args.memory?.operationalGraph?.environmentalInterpretation.productionFatigue ?? 0) * 0.55 + args.continuity.dormantInfluence * 0.2 + unresolved * 4);
  const exportEmphasis = clamp(args.ecosystem.exportMomentum * 0.68 + args.continuity.exportMomentum * 0.32);
  const renderTension = clamp(args.ecosystem.renderPressure * 0.66 + args.continuity.renderInstability * 0.34 + blockers * 4);
  const recoveryCalm = clamp((100 - args.continuity.continuityFracture) * 0.38 + args.ecosystem.recoveryPriority * 0.62);

  const mode: AdaptiveAtmosphereMode = args.continuity.continuityFracture >= 68
    ? "fractured"
    : renderTension >= 76
      ? "render_pressure"
      : exportEmphasis >= 72
        ? "export_momentum"
        : recoveryCalm >= 72 && renderTension < 62
          ? "recovery"
          : args.continuity.dormantInfluence >= 66
            ? "dormant"
            : args.ecosystem.operationalPressure >= 64
              ? "escalating"
              : args.ecosystem.operationalPressure >= 40
                ? "active"
                : "calm";

  const rhythm: AdaptiveAtmosphereRhythm = mode === "render_pressure" || mode === "escalating"
    ? "compressed"
    : mode === "export_momentum"
      ? "directional"
      : mode === "recovery"
        ? "stabilizing"
        : mode === "dormant"
          ? "cooling"
          : mode === "active"
            ? "focused"
            : "breathing";

  const density: AdaptiveAtmosphereDensity = mode === "render_pressure" || mode === "escalating" || mode === "fractured"
    ? "compressed"
    : mode === "export_momentum" || mode === "active"
      ? "compact"
      : mode === "recovery" || mode === "calm"
        ? "open"
        : "normal";

  const hierarchy = mode === "fractured" || mode === "render_pressure" ? "urgent" : mode === "export_momentum" || mode === "escalating" ? "sharp" : mode === "active" ? "normal" : "soft";
  const friction: AdaptiveAtmosphereFriction = mode === "fractured" ? "high" : mode === "render_pressure" || mode === "escalating" ? "visible" : mode === "active" || mode === "export_momentum" ? "subtle" : "none";
  const continuityDistortion = args.continuity.continuityFracture >= 68 ? "visible" : args.continuity.continuityFracture >= 40 ? "mild" : "none";

  const focusRoute = args.routeContext.split("/").filter(Boolean).slice(-1)[0] ?? "shopreel";
  const activeFocusLabel = mode === "export_momentum" ? "publish path active" : mode === "render_pressure" ? "render lane stabilization" : mode === "fractured" ? "continuity restoration" : `${focusRoute} workflow focus`;

  return {
    mode,
    rhythm,
    density,
    hierarchy,
    friction,
    continuityDistortion,
    exportEmphasis,
    renderTension,
    recoveryCalm,
    productionFatigue: fatigue,
    activeFocusLabel,
    conciseReadout: `${mode.replace("_", " ")} · ${rhythm} rhythm · ${activeFocusLabel}`,
    conciseExplainability: [
      `Mode ${mode} from pressure ${args.ecosystem.operationalPressure}, render tension ${renderTension}, export emphasis ${exportEmphasis}, and continuity fracture ${args.continuity.continuityFracture}.`,
      `Density ${density} and friction ${friction} to keep navigation explainable under current workload.`
    ],
  };
}
