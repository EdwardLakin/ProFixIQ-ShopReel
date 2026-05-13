import type { RuntimeChamberGeometry } from "@/features/shopreel/ui/system/runtimeChamberGeometry";
import type { RuntimeEnvironmentalIntelligence } from "@/features/shopreel/ui/system/runtimeEnvironmentalIntelligence";
import type { RuntimeEntityMaterialization } from "@/features/shopreel/ui/system/runtimeEntitySpace";
import type { RuntimeEmbodiedState } from "@/features/shopreel/ui/system/runtimeEmbodiment";

export function RuntimeEnvironmentField({ chamber, intelligence, entityMaterialization, embodied }: { chamber: RuntimeChamberGeometry; intelligence: RuntimeEnvironmentalIntelligence; entityMaterialization: RuntimeEntityMaterialization; embodied: RuntimeEmbodiedState }) {
  const incoherence = intelligence.orchestrationFragmentation * 0.08;
  const movementEnergy = intelligence.operationalRhythm === "active" ? 1 : intelligence.operationalRhythm === "stalled" ? 0.4 : 0.7;
  const continuityCorridor = embodied.continuityPressure * 0.45 + embodied.environmentalStabilization * 0.55;
  const pressure = entityMaterialization.entityPressure * 0.5 + intelligence.urgencyPressure * 0.5;
  return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    <div className="absolute inset-0" style={{ background: `radial-gradient(120% 68% at ${50 + intelligence.continuityPressure * 6}% 100%, rgba(56,189,248,${0.06 + intelligence.atmosphericDensity * 0.15 + entityMaterialization.entityClusterWeight * 0.12}), transparent ${70 + intelligence.silhouetteDistance * 10}%)` }} />
    <div className="absolute inset-0" style={{ background: `linear-gradient(${180 + intelligence.orchestrationFragmentation * 3}deg, rgba(8,13,25,${0.28 + intelligence.environmentalAttenuation * 0.2 + pressure * 0.1}), rgba(8,13,25,${0.46 + intelligence.spatialFog * 0.3}) 50%, rgba(2,6,23,0.9))` }} />
    <div className="absolute inset-y-[24%] left-[14%] right-[14%] rounded-[999px]" style={{ opacity: 0.05 + continuityCorridor * 0.08, background: `linear-gradient(90deg, transparent, rgba(125,211,252,${0.16 + continuityCorridor * 0.18}), transparent)`, transform: `translateY(${(entityMaterialization.entityDrift - 0.5) * 10}px)` }} />
    {Array.from({ length: intelligence.volumetricLayering }).map((_, index) => <div key={index} className="absolute left-0 right-0 transition-transform duration-700" style={{ top: `${18 + index * 11}%`, height: `${11 + chamber.backdrop.fogDensity * 8}%`, opacity: 0.06 + index * 0.025 + intelligence.workloadDensity * 0.02, transform: `translateX(${(index % 2 === 0 ? 1 : -1) * movementEnergy * incoherence * 100}%)`, background: "linear-gradient(90deg, transparent, rgba(148,163,184,0.45), transparent)" }} />)}
  </div>;
}
