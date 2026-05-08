import type { EnvironmentReactivityState } from "@/features/shopreel/ui/system/environmentReactivity";
import type { OperationalGraph, WorldZoneKind } from "@/features/shopreel/ui/system/operationalGraph";
import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export type EnvironmentalFieldState = {
  focusField: number;
  pressureField: number;
  continuityField: number;
  recoveryField: number;
  momentumField: number;
  escalationField: number;
  exportField: number;
  renderField: number;
  dormantField: number;
  orchestrationField: number;
  gravityWeighting: number;
  focusCompression: number;
  cinematicEmphasis: number;
  continuityAnchoring: number;
  operationalDrift: number;
  recoveryStabilization: number;
  exportPull: number;
  escalationBias: number;
  pacing: {
    breathingRhythm: number;
    compressionRhythm: number;
    escalationRhythm: number;
    recoveryRhythm: number;
    exportSurgeRhythm: number;
    dormantCoolingRhythm: number;
  };
  topology: {
    continuityRidges: number;
    fractureValleys: number;
    exportFronts: number;
    dormantBasins: number;
    recoveryCorridors: number;
    orchestrationPeaks: number;
    instabilityZones: number;
    visualTerrainWeighting: number;
  };
  environmentalMemory: {
    recurringInstabilityMemory: number;
    exportResidue: number;
    recoveryHistory: number;
    operationalErosion: number;
    continuityFatigue: number;
    stabilizationConfidence: number;
    orchestrationResilience: number;
    dormantSediment: number;
  };
  explainability: string[];
};

const zoneDensity = (graph: OperationalGraph | undefined, kind: WorldZoneKind) =>
  clamp((graph?.worldZones.filter((zone) => zone.kind === kind).reduce((sum, zone) => sum + zone.density, 0) ?? 0) * 0.55);

export function deriveEnvironmentalField(input: {
  memory: WorkspaceMemory | null;
  environment: EnvironmentReactivityState;
  readyTaskCount: number;
}): EnvironmentalFieldState {
  const graph = input.memory?.operationalGraph;
  const worldState = input.memory?.worldState;
  const continuityThreads = input.memory?.continuityThreads?.length ?? 0;
  const blockerCount = input.memory?.pendingTasks?.filter((task) => !task.done && /render|review|verify/i.test(task.label)).length ?? 0;
  const pendingCount = input.memory?.pendingTasks?.filter((task) => !task.done).length ?? 0;

  const focusField = clamp(input.environment.focusPull * 0.5 + (graph?.adaptiveRebalancing.focusDensityShift ?? 0) * 0.35 + input.readyTaskCount * 3);
  const pressureField = clamp(input.environment.environmentalCompression * 0.45 + input.environment.topologyTension * 0.35 + blockerCount * 8);
  const continuityField = clamp((graph?.continuityPressure ?? 0) * 0.45 + continuityThreads * 8 + input.environment.continuityScarring * 0.25);
  const recoveryField = clamp(input.environment.recoveryWarmth * 0.55 + (graph?.adaptiveRebalancing.environmentalCalmRestoration ?? 0) * 0.35);
  const momentumField = clamp((graph?.readinessPropagation ?? 0) * 0.4 + input.environment.exportMomentum * 0.35 + input.readyTaskCount * 5);
  const escalationField = clamp(input.environment.escalationPulse * 0.5 + input.environment.structuralInstability * 0.3 + blockerCount * 10);
  const exportField = clamp(input.environment.exportMomentum * 0.6 + (graph?.environmentalInterpretation.exportInevitability ?? 0) * 0.3);
  const renderField = clamp(input.environment.renderGravity * 0.6 + blockerCount * 12 + zoneDensity(graph, "unstable_branch") * 0.2);
  const dormantField = clamp(input.environment.dormantCooling * 0.6 + zoneDensity(graph, "dormant_zone") * 0.35 + Math.max(0, pendingCount - input.readyTaskCount) * 6);
  const orchestrationField = clamp(focusField * 0.25 + continuityField * 0.2 + exportField * 0.2 + recoveryField * 0.15 + momentumField * 0.2);

  const recurringInstabilityMemory = clamp((worldState?.memoryEvolution.recurringInstability ?? 0) * 0.75 + escalationField * 0.18);
  const exportResidue = clamp((worldState?.memoryEvolution.operationalResidue ?? 0) * 0.75 + exportField * 0.16);
  const recoveryHistory = clamp((worldState?.memoryEvolution.recoverySuccessMemory ?? 0) * 0.75 + recoveryField * 0.16);
  const operationalErosion = clamp((worldState?.memoryEvolution.bottleneckMemory ?? 0) * 0.75 + pressureField * 0.15);
  const continuityFatigue = clamp((worldState?.memoryEvolution.continuityScars ?? 0) * 0.75 + continuityField * 0.14);
  const stabilizationConfidence = clamp((worldState?.memoryEvolution.recoverySuccessMemory ?? 0) * 0.8 + recoveryField * 0.14);
  const orchestrationResilience = clamp((worldState?.memoryEvolution.recoverySuccessMemory ?? 0) * 0.8 + orchestrationField * 0.12);
  const dormantSediment = clamp((worldState?.memoryEvolution.operationalResidue ?? 0) * 0.75 + dormantField * 0.16);

  const breathingRhythm = clamp(70 - pressureField * 0.35 + recoveryField * 0.25 - escalationField * 0.15);
  const compressionRhythm = clamp(pressureField * 0.6 + escalationField * 0.2 + operationalErosion * 0.15);
  const escalationRhythm = clamp(escalationField * 0.58 + recurringInstabilityMemory * 0.2);
  const recoveryRhythm = clamp(recoveryField * 0.55 + stabilizationConfidence * 0.25 - continuityFatigue * 0.18);
  const exportSurgeRhythm = clamp(exportField * 0.56 + exportResidue * 0.24);
  const dormantCoolingRhythm = clamp(dormantField * 0.6 + dormantSediment * 0.2);

  const continuityRidges = clamp(continuityField * 0.55 + zoneDensity(graph, "momentum_corridor") * 0.25);
  const fractureValleys = clamp(input.environment.continuityDistortion * 0.5 + zoneDensity(graph, "continuity_fracture") * 0.3);
  const exportFronts = clamp(exportField * 0.58 + zoneDensity(graph, "export_pressure_region") * 0.24);
  const dormantBasins = clamp(dormantField * 0.58 + zoneDensity(graph, "dormant_zone") * 0.24);
  const recoveryCorridors = clamp(recoveryField * 0.55 + zoneDensity(graph, "recovery_region") * 0.28);
  const orchestrationPeaks = clamp(orchestrationField * 0.58 + zoneDensity(graph, "active_operational_zone") * 0.22);
  const instabilityZones = clamp(escalationField * 0.52 + zoneDensity(graph, "unstable_branch") * 0.28 + renderField * 0.2);
  const visualTerrainWeighting = clamp((continuityRidges + fractureValleys + exportFronts + recoveryCorridors + orchestrationPeaks + instabilityZones) / 6);

  return {
    focusField,
    pressureField,
    continuityField,
    recoveryField,
    momentumField,
    escalationField,
    exportField,
    renderField,
    dormantField,
    orchestrationField,
    gravityWeighting: clamp(focusField * 0.35 + pressureField * 0.2 + exportField * 0.25 + renderField * 0.2),
    focusCompression: clamp(pressureField * 0.48 + escalationField * 0.26 - recoveryField * 0.22),
    cinematicEmphasis: clamp(orchestrationField * 0.4 + focusField * 0.25 + continuityRidges * 0.2),
    continuityAnchoring: clamp(continuityField * 0.52 + recoveryCorridors * 0.22 + stabilizationConfidence * 0.16),
    operationalDrift: clamp(dormantField * 0.35 + operationalErosion * 0.35 + continuityFatigue * 0.2 - recoveryField * 0.15),
    recoveryStabilization: clamp(recoveryField * 0.5 + stabilizationConfidence * 0.25 + recoveryRhythm * 0.2),
    exportPull: clamp(exportField * 0.55 + exportSurgeRhythm * 0.22 + orchestrationField * 0.18),
    escalationBias: clamp(escalationField * 0.58 + compressionRhythm * 0.2 + fractureValleys * 0.16),
    pacing: { breathingRhythm, compressionRhythm, escalationRhythm, recoveryRhythm, exportSurgeRhythm, dormantCoolingRhythm },
    topology: { continuityRidges, fractureValleys, exportFronts, dormantBasins, recoveryCorridors, orchestrationPeaks, instabilityZones, visualTerrainWeighting },
    environmentalMemory: { recurringInstabilityMemory, exportResidue, recoveryHistory, operationalErosion, continuityFatigue, stabilizationConfidence, orchestrationResilience, dormantSediment },
    explainability: [
      "Field propagation is deterministic and derives from operational graph, world state memory evolution, continuity scars, readiness, blockers, and environmental reactivity.",
      `Gravity ${clamp(focusField * 0.35 + exportField * 0.25)} formed from focus ${focusField}, pressure ${pressureField}, export ${exportField}, render ${renderField}.`,
    ],
  };
}
