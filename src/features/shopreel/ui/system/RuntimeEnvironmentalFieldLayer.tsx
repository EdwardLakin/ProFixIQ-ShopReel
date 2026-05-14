"use client";

import type { RuntimeSpatialOrchestrationState } from "@/features/shopreel/ui/system/runtimeSpatialOrchestrator";

export function RuntimeEnvironmentalFieldLayer({ spatial, reducedMotion }: { spatial: RuntimeSpatialOrchestrationState; reducedMotion: boolean }) {
  const motionScale = reducedMotion ? 0 : spatial.environmentalMotionProfile.lowFrequencyMotion;
  const driftOffset = (spatial.activeChamberVector.x * 16) + (spatial.ambientDrift * 12);
  const pressureOpacity = 0.08 + spatial.tensionField * 0.18;

  return <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden" aria-hidden>
    <div className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at ${50 + spatial.activeChamberVector.x * 7}% ${90 - spatial.activeChamberVector.y * 10}%, rgba(56,189,248,${0.05 + spatial.atmosphericDensity * 0.18}), transparent 68%)` }} />
    <div className="absolute inset-0" style={{ background: `linear-gradient(${175 + spatial.environmentalMotionProfile.pressureGradient * 8}deg, rgba(8,13,25,0.25), rgba(2,6,23,${0.55 + spatial.atmosphericDensity * 0.25}))` }} />
    <div className="absolute inset-y-[18%] left-[8%] right-[8%] rounded-[999px]" style={{ opacity: pressureOpacity, background: "linear-gradient(90deg, transparent, rgba(125,211,252,0.55), transparent)", transform: reducedMotion ? "none" : `translateX(${driftOffset}px)` }} />
    {Object.entries(spatial.worldAdjacencyMap).slice(0, 5).map(([worldId, adjacent], index) => <div key={worldId} className="absolute rounded-[999px] border border-cyan-100/15 bg-cyan-200/5 blur-[1px]" style={{
      top: `${14 + index * 15}%`,
      left: `${6 + index * 14}%`,
      width: `${18 + adjacent.length * 1.8}%`,
      height: `${7 + adjacent.length * 0.7}%`,
      opacity: 0.05 + adjacent.length * 0.012,
      transform: reducedMotion ? "none" : `translate3d(${(index % 2 === 0 ? 1 : -1) * motionScale * 14}px, ${(motionScale - 0.5) * 8}px, 0)`,
    }} />)}
    <div className="absolute inset-0" style={{ opacity: 0.07 + spatial.interruptionTrajectory.intensity * 0.18, background: `conic-gradient(from 190deg at 50% 70%, transparent 0deg, rgba(248,113,113,0.6) 40deg, transparent 88deg)` }} />
  </div>;
}
