import type { RuntimeChamberGeometry } from "@/features/shopreel/ui/system/runtimeChamberGeometry";

export function RuntimeEnvironmentField({ chamber }: { chamber: RuntimeChamberGeometry }) {
  return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    <div className="absolute inset-0" style={{ background: `radial-gradient(120% 68% at 50% 100%, rgba(56,189,248,${0.09 + chamber.backdrop.horizonGlow * 0.22}), transparent 72%)` }} />
    <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(8,13,25,0.36), rgba(8,13,25,${0.46 + chamber.backdrop.fogDensity * 0.2}) 50%, rgba(2,6,23,0.88))` }} />
    {Array.from({ length: chamber.backdrop.volumetricBands }).map((_, index) => <div key={index} className="absolute left-0 right-0" style={{ top: `${20 + index * 14}%`, height: `${12 + chamber.backdrop.fogDensity * 8}%`, opacity: 0.08 + index * 0.03, background: "linear-gradient(90deg, transparent, rgba(148,163,184,0.5), transparent)" }} />)}
    <div className="absolute bottom-0 left-0 right-0 h-[35%]" style={{ opacity: 0.2 + chamber.backdrop.silhouetteDepth * 0.3, background: "linear-gradient(180deg, transparent, rgba(15,23,42,0.9))" }} />
  </div>;
}
