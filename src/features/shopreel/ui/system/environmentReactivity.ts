import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export type OperationalWeatherPattern =
  | "calm_recovery"
  | "export_surge"
  | "unstable_render_front"
  | "continuity_fracture"
  | "dormant_field"
  | "escalation_storm"
  | "recovery_clearing"
  | "active_production_pressure"
  | "cinematic_stabilization"
  | "orchestration_compression";

export type EnvironmentReactivityState = {
  environmentalCompression: number;
  continuityDistortion: number;
  renderGravity: number;
  exportMomentum: number;
  recoveryWarmth: number;
  topologyTension: number;
  dormantCooling: number;
  focusPull: number;
  atmosphericDensity: number;
  cinematicBreathing: number;
  escalationPulse: number;
  operationalWeather: {
    pattern: OperationalWeatherPattern;
    intensity: number;
    descriptor: string;
  };
  continuityScarring: number;
  temporalPressure: number;
  productionCalm: number;
  structuralInstability: number;
  explainability: string[];
};

export function deriveEnvironmentReactivity(input: {
  memory: WorkspaceMemory | null;
  readyTaskCount: number;
}): EnvironmentReactivityState {
  const pendingCount = input.memory?.pendingTasks?.filter((task) => !task.done).length ?? 0;
  const blockerCount = input.memory?.pendingTasks?.filter((task) => /review|render|verify/i.test(task.label) && !task.done).length ?? 0;
  const interrupted = Boolean(input.memory?.interruptedWorkflow);
  const continuityThreadCount = input.memory?.continuityThreads?.length ?? 0;
  const world = input.memory?.worldState;
  const graph = input.memory?.operationalGraph;
  const cinematic = input.memory?.productionConsciousness;

  const renderGravity = clamp((blockerCount * 26) + ((graph?.continuityPressure ?? 0) * 0.18));
  const exportMomentum = clamp((input.readyTaskCount * 24) + ((graph?.environmentalInterpretation.exportInevitability ?? 0) * 0.42) - (blockerCount * 8));
  const continuityDistortion = clamp((graph?.environmentalInterpretation.pacingVolatility ?? 0) * 0.58 + (interrupted ? 18 : 0) + (blockerCount * 10));
  const continuityScarring = clamp((world?.memoryEvolution.continuityScars ?? 0) * 0.72 + (world?.memoryEvolution.recurringInstability ?? 0) * 0.38 + (interrupted ? 10 : 0));
  const topologyTension = clamp((graph?.environmentalInterpretation.topologyStress ?? 0) * 0.65 + (graph?.adaptiveRebalancing.peripheralTelemetryCompression ?? 0) * 0.28);
  const structuralInstability = clamp((graph?.environmentalInterpretation.instabilityPressureIndex ?? 0) * 0.6 + (blockerCount * 14));
  const environmentalCompression = clamp((pendingCount * 12) + (topologyTension * 0.4) + (structuralInstability * 0.25) - (input.readyTaskCount * 6));
  const recoveryWarmth = clamp((graph?.adaptiveRebalancing.environmentalCalmRestoration ?? 0) * 0.62 + (world?.dormantRestorationWarmth ?? 0) * 0.3 + (continuityThreadCount * 8));
  const dormantCooling = clamp((world?.renderCooling ?? 0) * 0.6 + Math.max(0, pendingCount - input.readyTaskCount) * 8);
  const focusPull = clamp((cinematic?.cinematicPrioritization.exportInevitability ?? 0) * 0.45 + (cinematic?.attentionEconomy.blockerPressure ?? 0) * 0.35 + (graph?.adaptiveRebalancing.publicationFrontPull ?? 0) * 0.2);
  const atmosphericDensity = clamp((graph?.dimensionalLayers.find((layer) => layer.key === "cinematic_layer")?.density ?? 0) * 0.52 + (environmentalCompression * 0.3) + (continuityScarring * 0.2));
  const cinematicBreathing = clamp((graph?.temporalCinematography.breathingCycle ?? 0) * 0.55 + (recoveryWarmth * 0.28) - (environmentalCompression * 0.24));
  const escalationPulse = clamp((graph?.continuityWeather.pressure ?? 0) * 0.5 + (structuralInstability * 0.3) + (blockerCount * 12));
  const temporalPressure = clamp((world?.operationalAging ?? 0) * 0.45 + (world?.continuityDecay ?? 0) * 0.4 + (pendingCount * 8));
  const productionCalm = clamp((graph?.environmentalInterpretation.operationalHarmony ?? 0) * 0.55 + (recoveryWarmth * 0.25) - (escalationPulse * 0.22));

  const pattern: OperationalWeatherPattern =
    escalationPulse >= 78 ? "escalation_storm"
    : structuralInstability >= 72 ? "unstable_render_front"
      : continuityScarring >= 70 ? "continuity_fracture"
        : exportMomentum >= 72 ? "export_surge"
          : recoveryWarmth >= 70 && structuralInstability < 48 ? "recovery_clearing"
            : dormantCooling >= 65 ? "dormant_field"
              : environmentalCompression >= 70 ? "orchestration_compression"
                : productionCalm >= 68 ? "cinematic_stabilization"
                  : interrupted ? "active_production_pressure"
                    : "calm_recovery";

  const descriptorMap: Record<OperationalWeatherPattern, string> = {
    calm_recovery: "Calm recovery lane with low operational drag.",
    export_surge: "Export fronts are pulling attention toward publication.",
    unstable_render_front: "Render topology is unstable and needs pressure relief.",
    continuity_fracture: "Continuity threads show recurring fractures and scar load.",
    dormant_field: "Dormant residue is cooling activity and reducing momentum.",
    escalation_storm: "Escalation pressure is peaking across critical chains.",
    recovery_clearing: "Recovery corridors are widening and restoring cohesion.",
    active_production_pressure: "Active production pressure with constrained breathing room.",
    cinematic_stabilization: "Cinematic stabilization is holding the environment steady.",
    orchestration_compression: "Orchestration compression is condensing workspace density.",
  };

  return {
    environmentalCompression,
    continuityDistortion,
    renderGravity,
    exportMomentum,
    recoveryWarmth,
    topologyTension,
    dormantCooling,
    focusPull,
    atmosphericDensity,
    cinematicBreathing,
    escalationPulse,
    operationalWeather: {
      pattern,
      intensity: clamp((atmosphericDensity * 0.35) + (escalationPulse * 0.35) + (focusPull * 0.3)),
      descriptor: descriptorMap[pattern],
    },
    continuityScarring,
    temporalPressure,
    productionCalm,
    structuralInstability,
    explainability: [
      "Environmental reactivity derives from operational graph, world state, continuity threads, and pending tasks.",
      `Weather pattern ${pattern} selected from escalation ${escalationPulse}, instability ${structuralInstability}, export ${exportMomentum}, and calm ${productionCalm}.`,
    ],
  };
}
