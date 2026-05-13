import type { RuntimeChamberGeometry } from "@/features/shopreel/ui/system/runtimeChamberGeometry";
import type { RuntimeEnvironmentalIntelligence } from "@/features/shopreel/ui/system/runtimeEnvironmentalIntelligence";

export function RuntimeEnvironmentField({ chamber, intelligence }: { chamber: RuntimeChamberGeometry; intelligence: RuntimeEnvironmentalIntelligence }) {
  return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    <div className="absolute inset-0" style={{ background: `radial-gradient(120% 68% at 50% 100%, rgba(56,189,248,${0.08 + intelligence.atmosphericDensity * 0.2}), transparent ${70 + intelligence.silhouetteDistance * 10}%)` }} />
    <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(8,13,25,${0.28 + intelligence.environmentalAttenuation * 0.2}), rgba(8,13,25,${0.46 + intelligence.spatialFog * 0.3}) 50%, rgba(2,6,23,0.9))` }} />
    {Array.from({ length: intelligence.volumetricLayering }).map((_, index) => <div key={index} className="absolute left-0 right-0" style={{ top: `${18 + index * 11}%`, height: `${11 + chamber.backdrop.fogDensity * 8}%`, opacity: 0.06 + index * 0.025, background: "linear-gradient(90deg, transparent, rgba(148,163,184,0.45), transparent)" }} />)}
  </div>;
}
