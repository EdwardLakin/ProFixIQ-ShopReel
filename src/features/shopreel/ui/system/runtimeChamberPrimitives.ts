export const runtimeChamberPrimitives = {
  spatialStageContainer:
    "relative isolate w-full overflow-visible rounded-[2rem] border border-white/10 bg-[radial-gradient(130%_130%_at_50%_0%,rgba(56,189,248,.16),rgba(7,14,28,.9)_46%,rgba(3,7,18,.98)_100%)] p-4 md:p-6 shadow-[0_40px_140px_rgba(2,6,23,.62)]",
  focalActionPlane:
    "relative z-30 overflow-visible rounded-[1.8rem] border border-cyan-200/25 bg-[radial-gradient(120%_140%_at_50%_0%,rgba(34,211,238,.22),rgba(6,14,28,.86)_52%,rgba(3,7,18,.97)_100%)] p-4 md:p-5 shadow-[0_45px_120px_rgba(6,182,212,.28)]",
  recessedSystemPlane:
    "relative z-20 rounded-[1.3rem] border border-white/12 bg-[linear-gradient(175deg,rgba(10,18,33,.78),rgba(4,9,20,.92))] p-3 shadow-[0_20px_70px_rgba(2,6,23,.52)]",
  distantTopologyMarker:
    "relative z-10 rounded-full border border-white/12 bg-slate-950/35 px-4 py-2 text-[11px] text-white/60",
  environmentalTelemetryNode:
    "rounded-xl border border-cyan-200/18 bg-cyan-400/[0.07] px-3 py-2 text-xs text-cyan-100/85",
  chamberOperatorPresence:
    "relative z-20 rounded-[1.2rem] border border-cyan-200/20 bg-[radial-gradient(120%_130%_at_100%_0%,rgba(34,211,238,.16),rgba(8,16,30,.86)_48%,rgba(3,7,18,.92)_100%)] p-3",
  depthAttenuation: "opacity-70 md:opacity-80 saturate-[0.92]",
} as const;
