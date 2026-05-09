import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import type { EnvironmentalFieldState } from "@/features/shopreel/ui/system/environmentField";
import type { EnvironmentReactivityState } from "@/features/shopreel/ui/system/environmentReactivity";
import type { OperationalGraph } from "@/features/shopreel/ui/system/operationalGraph";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export type StrategicDepthLayerKey = "tactical"|"execution"|"continuity"|"orchestration"|"export"|"recovery"|"dormant"|"cinematic";

export type StrategicDepthLayer = { key: StrategicDepthLayerKey; depthHierarchy:number; surfaceProminence:number; visualCompression:number; panelQuieting:number; atmosphericIntensity:number; contextualWeighting:number; terrainProminence:number; };

export type CognitiveState = {
  operationalAttention:number; strategicFocus:number; executionConfidence:number; continuityAwareness:number; recoveryIntelligence:number; escalationPrediction:number; exportIntent:number; orchestrationClarity:number; productionFatigue:number; narrativeMomentum:number; operationalResilience:number; renderAnxiety:number; continuityTrust:number; dormantEntropy:number; recoveryConfidence:number;
  cognitiveGravity:{ pressureWeight:number; directionalClarity:number; distortionGravity:number; dormantDrift:number; recoveryStabilization:number; hierarchySharpness:number; fatigueHaze:number; resilienceCoherence:number; };
  strategicDepth:Record<StrategicDepthLayerKey, StrategicDepthLayer>;
  continuityIntelligence:{ fractureForecasting:number; stabilizationConfidence:number; continuityMomentum:number; interruptionAccumulation:number; recoveryViability:number; orchestrationSustainability:number; fatigueAccumulation:number; exportSurvivability:number; };
  productionRhythm:{ escalationMetabolism:number; recoveryMetabolism:number; exportMetabolism:number; orchestrationMetabolism:number; dormantMetabolism:number; cinematicMetabolism:number; fatigueMetabolism:number; stabilizationMetabolism:number; shellDensity:number; spacingRhythm:number; visualBreathing:number; atmosphereTemperature:number; operationalContrast:number; continuitySharpness:number; gravityIntensity:number; railCompactness:number; };
  explainability:string[];
};

export function deriveCognitiveShellDynamics(state: CognitiveState | null) {
  if (!state) return { shellDensity: 52, breathing: 58, gravity: 50, quieting: 54 };
  return {
    shellDensity: state.productionRhythm.shellDensity,
    breathing: state.productionRhythm.visualBreathing,
    gravity: state.productionRhythm.gravityIntensity,
    quieting: state.strategicDepth.orchestration.panelQuieting,
  };
}

export function deriveCognitiveState(input:{memory:WorkspaceMemory|null; environment:EnvironmentReactivityState; field:EnvironmentalFieldState; readyTaskCount:number;}): CognitiveState {
  const graph: OperationalGraph | undefined = input.memory?.operationalGraph;
  const pendingCount = input.memory?.pendingTasks?.filter((t)=>!t.done).length ?? 0;
  const blockerCount = input.memory?.pendingTasks?.filter((t)=>!t.done && /render|review|verify|publish/i.test(t.label)).length ?? 0;
  const scars = input.memory?.worldState?.memoryEvolution.continuityScars ?? 0;
  const interrupted = input.memory?.interruptedWorkflow ? 14 : 0;

  const operationalAttention = clamp(input.field.focusField*0.45 + input.field.pressureField*0.25 + input.environment.focusPull*0.2 + blockerCount*4);
  const strategicFocus = clamp(input.field.orchestrationField*0.48 + input.field.cinematicEmphasis*0.24 + input.readyTaskCount*6 - pendingCount*2);
  const executionConfidence = clamp((graph?.environmentalInterpretation.executionConfidence ?? 0)*0.65 + input.field.recoveryStabilization*0.2 - blockerCount*4);
  const continuityAwareness = clamp(input.field.continuityField*0.55 + input.environment.continuityScarring*0.3 + (input.memory?.continuityThreads?.length ?? 0)*4);
  const recoveryIntelligence = clamp(input.field.recoveryField*0.6 + input.field.environmentalMemory.recoveryHistory*0.22 + (graph?.adaptiveRebalancing.environmentalCalmRestoration ?? 0)*0.15);
  const escalationPrediction = clamp(input.environment.escalationPulse*0.54 + input.field.escalationBias*0.25 + input.field.environmentalMemory.recurringInstabilityMemory*0.18);
  const exportIntent = clamp(input.field.exportField*0.62 + input.field.exportPull*0.26 + input.readyTaskCount*4);
  const orchestrationClarity = clamp(input.field.orchestrationField*0.5 + input.field.topology.orchestrationPeaks*0.22 + input.environment.productionCalm*0.2 - input.environment.topologyTension*0.15);
  const productionFatigue = clamp((graph?.environmentalInterpretation.productionFatigue ?? 0)*0.62 + input.field.environmentalMemory.operationalErosion*0.24 + pendingCount*3);
  const narrativeMomentum = clamp(input.field.momentumField*0.58 + input.field.pacing.exportSurgeRhythm*0.15 + input.field.pacing.recoveryRhythm*0.18 - input.field.pacing.compressionRhythm*0.18);
  const operationalResilience = clamp((graph?.environmentalInterpretation.continuityResilience ?? 0)*0.55 + recoveryIntelligence*0.25 + continuityAwareness*0.2 - escalationPrediction*0.14);
  const renderAnxiety = clamp(input.field.renderField*0.55 + input.environment.structuralInstability*0.25 + blockerCount*7 + interrupted);
  const continuityTrust = clamp(continuityAwareness*0.52 + operationalResilience*0.28 + recoveryIntelligence*0.2 - scars*0.18);
  const dormantEntropy = clamp(input.field.dormantField*0.6 + input.field.environmentalMemory.dormantSediment*0.22 + Math.max(0,pendingCount-input.readyTaskCount)*5);
  const recoveryConfidence = clamp(recoveryIntelligence*0.58 + operationalResilience*0.24 + input.field.recoveryStabilization*0.2 - renderAnxiety*0.12);

  const mkLayer = (key: StrategicDepthLayerKey, seed:number): StrategicDepthLayer => ({ key, depthHierarchy: clamp(seed), surfaceProminence: clamp(seed*0.9 + strategicFocus*0.14), visualCompression: clamp(input.field.focusCompression*0.52 + escalationPrediction*0.15 - recoveryConfidence*0.18), panelQuieting: clamp(recoveryIntelligence*0.44 + dormantEntropy*0.2), atmosphericIntensity: clamp(input.environment.atmosphericDensity*0.54 + input.field.cinematicEmphasis*0.22), contextualWeighting: clamp(seed*0.64 + orchestrationClarity*0.22), terrainProminence: clamp(input.field.topology.visualTerrainWeighting*0.52 + seed*0.28)});

  return {
    operationalAttention, strategicFocus, executionConfidence, continuityAwareness, recoveryIntelligence, escalationPrediction, exportIntent, orchestrationClarity, productionFatigue, narrativeMomentum, operationalResilience, renderAnxiety, continuityTrust, dormantEntropy, recoveryConfidence,
    cognitiveGravity: { pressureWeight: clamp(escalationPrediction*0.52 + renderAnxiety*0.22), directionalClarity: clamp(exportIntent*0.54 + orchestrationClarity*0.26), distortionGravity: clamp((100-continuityTrust)*0.46 + input.environment.continuityDistortion*0.3), dormantDrift: clamp(dormantEntropy*0.55 - strategicFocus*0.15), recoveryStabilization: clamp(recoveryConfidence*0.6 + recoveryIntelligence*0.2), hierarchySharpness: clamp(orchestrationClarity*0.58 + strategicFocus*0.2), fatigueHaze: clamp(productionFatigue*0.62 + input.field.operationalDrift*0.18), resilienceCoherence: clamp(operationalResilience*0.62 + continuityTrust*0.2) },
    strategicDepth: {
      tactical: mkLayer("tactical", operationalAttention), execution: mkLayer("execution", executionConfidence), continuity: mkLayer("continuity", continuityTrust), orchestration: mkLayer("orchestration", orchestrationClarity), export: mkLayer("export", exportIntent), recovery: mkLayer("recovery", recoveryConfidence), dormant: mkLayer("dormant", dormantEntropy), cinematic: mkLayer("cinematic", narrativeMomentum),
    },
    continuityIntelligence: { fractureForecasting: clamp(escalationPrediction*0.52 + scars*0.3), stabilizationConfidence: recoveryConfidence, continuityMomentum: clamp(narrativeMomentum*0.55 + continuityAwareness*0.2), interruptionAccumulation: clamp(interrupted*4 + blockerCount*12 + input.field.environmentalMemory.recurringInstabilityMemory*0.22), recoveryViability: clamp(recoveryIntelligence*0.62 + operationalResilience*0.2), orchestrationSustainability: clamp(orchestrationClarity*0.58 + operationalResilience*0.22), fatigueAccumulation: clamp(productionFatigue*0.6 + input.environment.temporalPressure*0.2), exportSurvivability: clamp(exportIntent*0.58 + continuityTrust*0.2 - renderAnxiety*0.18) },
    productionRhythm: { escalationMetabolism: clamp(escalationPrediction*0.58 + input.field.pacing.escalationRhythm*0.2), recoveryMetabolism: clamp(recoveryIntelligence*0.54 + input.field.pacing.recoveryRhythm*0.22), exportMetabolism: clamp(exportIntent*0.56 + input.field.pacing.exportSurgeRhythm*0.2), orchestrationMetabolism: clamp(orchestrationClarity*0.56 + operationalAttention*0.2), dormantMetabolism: clamp(dormantEntropy*0.6), cinematicMetabolism: clamp(narrativeMomentum*0.58 + input.environment.cinematicBreathing*0.2), fatigueMetabolism: clamp(productionFatigue*0.64), stabilizationMetabolism: clamp(recoveryConfidence*0.56 + operationalResilience*0.2), shellDensity: clamp(input.field.gravityWeighting*0.5 + escalationPrediction*0.18 - recoveryConfidence*0.16), spacingRhythm: clamp(70 - input.field.focusCompression*0.35 + recoveryIntelligence*0.22), visualBreathing: clamp(input.environment.cinematicBreathing*0.62 - productionFatigue*0.2), atmosphereTemperature: clamp(input.environment.recoveryWarmth*0.5 + escalationPrediction*0.2 - dormantEntropy*0.18), operationalContrast: clamp(renderAnxiety*0.42 + strategicFocus*0.24), continuitySharpness: clamp(continuityTrust*0.6 - productionFatigue*0.18), gravityIntensity: clamp(escalationPrediction*0.42 + orchestrationClarity*0.22 + exportIntent*0.2), railCompactness: clamp(input.field.focusCompression*0.48 + escalationPrediction*0.2 - recoveryIntelligence*0.16) },
    explainability:["Cognitive state is deterministic from operational graph topology, environment field propagation, continuity memory scars, blockers, export pressure, and recovery history.",`Attention ${operationalAttention}, focus ${strategicFocus}, and resilience ${operationalResilience} computed without autonomous behavior.`]
  };
}
