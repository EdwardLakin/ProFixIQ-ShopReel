export type RuntimeSignal = "known" | "unknown";
export type RuntimeEnvironmentalIntelligence = {
  atmosphereDensity: number;
  fogDepth: number;
  chamberTension: number;
  surfaceBrightness: number;
  focalClarity: number;
  peripheralActivity: number;
  environmentalPulse: number;
  recoveryCalm: number;
  blockedFlowPressure: number;
  signal: RuntimeSignal;
};

export function deriveRuntimeEnvironmentalIntelligence(input: {
  urgency: number | null;
  workload: number | null;
  unresolvedBlockers: number | null;
  renderQueueState: number | null;
  creativeIntensity: number | null;
  operationalState: number | null;
  temporalVolatility: number | null;
  dependencyPressure: number | null;
  continuityResilience: number | null;
}): RuntimeEnvironmentalIntelligence {
  const values = [input.urgency, input.workload, input.unresolvedBlockers, input.renderQueueState, input.creativeIntensity, input.operationalState, input.temporalVolatility, input.dependencyPressure, input.continuityResilience].filter((v): v is number => typeof v === "number");
  if (values.length === 0) {
    return { atmosphereDensity: 0.5, fogDepth: 0.2, chamberTension: 0.5, surfaceBrightness: 0.5, focalClarity: 0.6, peripheralActivity: 0.4, environmentalPulse: 0.4, recoveryCalm: 0.5, blockedFlowPressure: 0.5, signal: "unknown" };
  }
  const safe = (n: number | null, fallback: number) => Math.min(1, Math.max(0, n ?? fallback));
  const blockers = safe(input.unresolvedBlockers, 0.3);
  const urgency = safe(input.urgency, 0.5);
  const volatility = safe(input.temporalVolatility, 0.4);
  const resilience = safe(input.continuityResilience, 0.5);
  const pressure = safe(input.dependencyPressure, 0.4);
  return {
    atmosphereDensity: 0.35 + urgency * 0.45,
    fogDepth: 0.1 + volatility * 0.35,
    chamberTension: 0.2 + (urgency + pressure) * 0.35,
    surfaceBrightness: 0.74 - blockers * 0.34,
    focalClarity: 0.9 - volatility * 0.3,
    peripheralActivity: 0.25 + safe(input.workload, 0.4) * 0.5,
    environmentalPulse: 0.2 + safe(input.creativeIntensity, 0.4) * 0.6,
    recoveryCalm: 0.2 + resilience * 0.65,
    blockedFlowPressure: 0.12 + blockers * 0.78,
    signal: "known",
  };
}
