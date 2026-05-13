import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export type RuntimeUnresolvedIntent = { label: string; href: string; pressure: number };
export type RuntimeActiveTrajectory = { worldId: RuntimeWorldId; focalEntityId: string | null; direction: "advance" | "stabilize" | "recover" };
export type RuntimeInteractionResidue = { residueWeight: number; recentRouteCount: number; unresolvedIntensity: number };
export type RuntimeChamberRhythmMemory = { rhythm: number; carryover: number };
export type RuntimeOperationalFatigue = { fatigue: number; recoverable: boolean };
export type RuntimeNavigationMomentum = { momentum: number; continuityBias: number };

export type RuntimeContinuityMemory = {
  unresolvedIntent: RuntimeUnresolvedIntent | null;
  activeTrajectory: RuntimeActiveTrajectory;
  interactionResidue: RuntimeInteractionResidue;
  chamberRhythm: RuntimeChamberRhythmMemory;
  operationalFatigue: RuntimeOperationalFatigue;
  navigationMomentum: RuntimeNavigationMomentum;
};

export function deriveRuntimeContinuityMemory(input: {
  worldId: RuntimeWorldId;
  focalEntityId: string | null;
  unresolvedCount: number;
  continuityMomentum: number;
  continuityPressure: number;
  recentRouteCount: number;
  latestAction: { label: string; href: string } | null;
  trajectory: "advance" | "stabilize" | "recover";
}): RuntimeContinuityMemory {
  const unresolvedIntensity = clamp(input.unresolvedCount / 5);
  const residueWeight = clamp(input.continuityPressure * 0.55 + unresolvedIntensity * 0.45);
  const fatigue = clamp(unresolvedIntensity * 0.6 + Math.min(1, input.recentRouteCount / 8) * 0.4);
  return {
    unresolvedIntent: input.latestAction && unresolvedIntensity > 0 ? { label: input.latestAction.label, href: input.latestAction.href, pressure: unresolvedIntensity } : null,
    activeTrajectory: { worldId: input.worldId, focalEntityId: input.focalEntityId, direction: input.trajectory },
    interactionResidue: { residueWeight, recentRouteCount: input.recentRouteCount, unresolvedIntensity },
    chamberRhythm: { rhythm: clamp(input.continuityMomentum * 0.65 + (1 - unresolvedIntensity) * 0.35), carryover: clamp(input.continuityMomentum * 0.7 + residueWeight * 0.3) },
    operationalFatigue: { fatigue, recoverable: fatigue < 0.72 },
    navigationMomentum: { momentum: clamp(input.continuityMomentum * 0.6 + Math.min(1, input.recentRouteCount / 10) * 0.4), continuityBias: clamp(1 - input.continuityPressure * 0.5) },
  };
}
