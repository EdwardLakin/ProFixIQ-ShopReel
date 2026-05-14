"use client";

import type { RuntimeWorldTopologyState } from "@/features/shopreel/ui/system/runtimeWorldTopology";

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const DEPTH_STYLE = {
  near: { scale: 1, blur: 0.8, opacity: 0.26 },
  mid: { scale: 0.9, blur: 1.4, opacity: 0.2 },
  far: { scale: 0.82, blur: 2.2, opacity: 0.14 },
} as const;

export function RuntimeWorldTopologyLayer({ topology, reducedMotion }: { topology: RuntimeWorldTopologyState; reducedMotion: boolean }) {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    {topology.nodes.map((node) => {
      const depth = DEPTH_STYLE[node.depthTier];
      const pulseScale = 1 + node.interruptionPressure * 0.12;
      const hue = Math.round(180 + node.heatIntensity * 40);
      return <div key={node.worldId} className="absolute" style={{ left: `${node.xPercent}%`, top: `${node.yPercent}%`, transform: `translate(-50%, -50%) scale(${(depth.scale + node.heatIntensity * 0.08).toFixed(3)})` }} data-topology-world={node.worldId} data-topology-label={node.semanticLabel}>
        <div className="relative h-[9.6rem] w-[15.5rem] rounded-[44%] border border-white/10 bg-slate-900/18" style={{ opacity: clamp01(depth.opacity + node.heatIntensity * 0.18).toFixed(3), filter: `blur(${(depth.blur + (1 - node.interruptionPressure) * 1.3).toFixed(2)}px)` }}>
          <div className="absolute inset-[12%] rounded-[40%] border border-cyan-100/20" />
          {node.motif === "orbit_rings" && <div className="absolute inset-[18%] rounded-full border border-violet-300/30"><div className="absolute inset-[-16%] rounded-full border border-violet-200/20" /></div>}
          {node.motif === "spark_branch" && <div className="absolute inset-x-[16%] top-[22%] h-px bg-amber-200/50"><div className="absolute left-[26%] top-[-16px] h-4 w-px bg-amber-100/50" /><div className="absolute right-[20%] top-[7px] h-px w-[32%] rotate-[18deg] bg-amber-200/45" /></div>}
          {node.motif === "asset_vault" && <div className="absolute inset-[18%] space-y-2">{[0,1,2].map((i) => <div key={i} className="h-4 rounded border border-teal-200/25 bg-teal-100/10" />)}</div>}
          {node.motif === "motion_rail" && <div className="absolute inset-y-[24%] left-[16%] right-[16%] border-y border-cyan-100/25"><div className="absolute left-[14%] top-[45%] h-[2px] w-[72%] bg-cyan-200/40" /></div>}
          {node.motif === "timeline_corridor" && <div className="absolute inset-y-[18%] left-1/2 w-px -translate-x-1/2 bg-emerald-100/35"><div className="absolute top-[16%] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-emerald-200/45" /></div>}
          {node.motif === "telemetry_grid" && <div className="absolute inset-[16%] grid grid-cols-4 gap-1.5">{Array.from({ length: 12 }).map((_, idx) => <div key={idx} className="rounded-sm border border-sky-100/25 bg-sky-100/10" />)}</div>}
          {node.motif === "command_core" && <div className="absolute inset-[24%] rounded-[28%] border border-slate-100/25"><div className="absolute inset-[20%] rounded-full border border-cyan-100/25" /></div>}
        </div>
        <div className="absolute inset-0 rounded-[46%] border border-cyan-200/30" style={{ opacity: (0.16 + node.interruptionPressure * 0.34).toFixed(3), transform: `scale(${pulseScale.toFixed(3)})`, transition: reducedMotion ? "none" : "transform 900ms ease-out, opacity 700ms ease-out", boxShadow: `0 0 48px hsla(${hue}, 90%, 70%, ${Math.max(0.08, node.heatIntensity * 0.2).toFixed(3)})` }} />
      </div>;
    })}
  </div>;
}
