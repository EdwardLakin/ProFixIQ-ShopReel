"use client";

import type { RuntimeWorldTopologyState } from "@/features/shopreel/ui/system/runtimeWorldTopology";

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export function RuntimePresenceRenderLayer({ topology, reducedMotion }: { topology: RuntimeWorldTopologyState; reducedMotion: boolean }) {
  const haze = clamp01(topology.ambientPressure);

  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
    <div className="absolute inset-0" style={{ background: `radial-gradient(90% 62% at 50% 78%, rgba(56,189,248,${(0.04 + haze * 0.12).toFixed(3)}), transparent 72%), radial-gradient(64% 40% at 48% 24%, rgba(129,140,248,${(0.03 + haze * 0.08).toFixed(3)}), transparent 76%)` }} />
    {topology.nodes.map((node) => {
      const radius = 180 + node.heatIntensity * 140;
      const opacity = clamp01(0.08 + node.heatIntensity * 0.18 + node.interruptionPressure * 0.1);
      return <div key={`presence-${node.worldId}`} className="absolute rounded-full" style={{ left: `${node.xPercent}%`, top: `${node.yPercent}%`, width: `${radius}px`, height: `${radius * 0.62}px`, transform: "translate(-50%, -50%)", opacity: opacity.toFixed(3), transition: reducedMotion ? "none" : "opacity 700ms ease-out", background: "radial-gradient(circle at 50% 50%, rgba(125,211,252,0.26), rgba(99,102,241,0.12) 48%, rgba(15,23,42,0) 75%)", filter: `blur(${(10 + (1 - node.interruptionPressure) * 8).toFixed(2)}px)` }} />;
    })}
  </div>;
}
