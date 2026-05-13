export type RuntimeSignal = "known" | "unknown";
export type RuntimeEnvironmentalIntelligence = {
  atmosphericDensity: number;
  silhouetteDistance: number;
  focalClarity: number;
  environmentalAttenuation: number;
  chamberBrightnessZones: number;
  volumetricLayering: number;
  spatialFog: number;
  distantActivityBands: number;
  peripheralMotionWeighting: number;
  urgencyPressure: number;
  operatorOverload: number;
  continuityPressure: number;
  workloadDensity: number;
  orchestrationFragmentation: number;
  recoveryState: "stable" | "decompressing" | "restoring";
  operationalRhythm: "steady" | "active" | "stalled";
  signal: RuntimeSignal;
};

const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function deriveRuntimeEnvironmentalIntelligence(input: { urgency: number | null; workload: number | null; unresolvedBlockers: number | null; renderQueueState: number | null; creativeIntensity: number | null; operationalState: number | null; temporalVolatility: number | null; dependencyPressure: number | null; continuityResilience: number | null; continuityPressure?: number | null; workloadDensity?: number | null; orchestrationFragmentation?: number | null; recoveryState?: "stable" | "decompressing" | "restoring"; operationalRhythm?: "steady" | "active" | "stalled"; }): RuntimeEnvironmentalIntelligence {
  const values = [input.urgency, input.workload, input.unresolvedBlockers, input.renderQueueState, input.creativeIntensity, input.operationalState, input.temporalVolatility, input.dependencyPressure, input.continuityResilience].filter((v): v is number => typeof v === "number");
  if (!values.length) {
    return { atmosphericDensity: 0.42, silhouetteDistance: 0.45, focalClarity: 0.62, environmentalAttenuation: 0.35, chamberBrightnessZones: 3, volumetricLayering: 3, spatialFog: 0.28, distantActivityBands: 2, peripheralMotionWeighting: 0.3, urgencyPressure: 0.4, operatorOverload: 0.34, continuityPressure: 0.4, workloadDensity: 0.4, orchestrationFragmentation: 0.32, recoveryState: "restoring", operationalRhythm: "steady", signal: "unknown" };
  }
  const urgency = clamp(input.urgency ?? 0.5);
  const blockers = clamp(input.unresolvedBlockers ?? 0.4);
  const congestion = clamp(input.renderQueueState ?? 0.35);
  const backlog = clamp(input.dependencyPressure ?? 0.4);
  const frag = clamp(input.operationalState ?? 0.4);
  const volatility = clamp(input.temporalVolatility ?? 0.4);
  const overload = clamp(((input.workload ?? 0.4) + blockers + backlog) / 3);
  const recovery = clamp(input.continuityResilience ?? 0.5);
  const pressure = clamp((urgency * 0.3) + (blockers * 0.24) + (congestion * 0.2) + (backlog * 0.14) + (frag * 0.12));
  return {
    atmosphericDensity: 0.22 + pressure * 0.58,
    silhouetteDistance: 0.7 - pressure * 0.4,
    focalClarity: 0.88 - volatility * 0.28,
    environmentalAttenuation: 0.18 + pressure * 0.54,
    chamberBrightnessZones: Math.max(2, Math.round(2 + (1 - blockers) * 3)),
    volumetricLayering: Math.max(2, Math.round(2 + pressure * 4)),
    spatialFog: 0.12 + volatility * 0.5,
    distantActivityBands: Math.max(1, Math.round(1 + congestion * 4)),
    peripheralMotionWeighting: 0.14 + overload * 0.52,
    urgencyPressure: pressure,
    operatorOverload: overload * (1 - recovery * 0.2),
    continuityPressure: clamp(input.continuityPressure ?? pressure),
    workloadDensity: clamp(input.workloadDensity ?? overload),
    orchestrationFragmentation: clamp(input.orchestrationFragmentation ?? volatility),
    recoveryState: input.recoveryState ?? "restoring",
    operationalRhythm: input.operationalRhythm ?? "steady",
    signal: "known",
  };
}
