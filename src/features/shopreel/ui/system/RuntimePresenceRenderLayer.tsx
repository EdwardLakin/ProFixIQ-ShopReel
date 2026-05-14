"use client";

import type { RuntimeWorldPresenceCoordinatorState } from "@/features/shopreel/ui/system/worldPresenceCoordinator";

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const PRESENCE_DEPTH: Record<string, { opacity: number; blur: number; scale: number }> = {
  dominant: { opacity: 0.06, blur: 0.6, scale: 1 },
  peripheral: { opacity: 0.16, blur: 1.6, scale: 0.94 },
  ambient: { opacity: 0.14, blur: 2.4, scale: 0.91 },
  emerging: { opacity: 0.18, blur: 1.4, scale: 0.96 },
  interrupting: { opacity: 0.24, blur: 1.1, scale: 0.98 },
  fading: { opacity: 0.08, blur: 3.2, scale: 0.88 },
};

export function RuntimePresenceRenderLayer({ worldPresence, reducedMotion }: { worldPresence: RuntimeWorldPresenceCoordinatorState; reducedMotion: boolean }) {
  const mountedWorlds = worldPresence.mountedWorldIds
    .map((id) => worldPresence.worlds[id])
    .filter((world): world is NonNullable<typeof world> => Boolean(world) && world.worldId !== worldPresence.foregroundWorldId)
    .slice(0, 4);

  const haze = clamp01(worldPresence.atmosphere.intensity * 0.55 + worldPresence.atmosphere.topologyGlow * 0.45);

  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0" style={{ background: `radial-gradient(90% 62% at 50% 76%, rgba(56,189,248,${(0.04 + haze * 0.12).toFixed(3)}), transparent 72%), radial-gradient(60% 40% at 48% 28%, rgba(129,140,248,${(0.035 + haze * 0.08).toFixed(3)}), transparent 78%)` }} />
    {mountedWorlds.map((world, index) => {
      const depth = PRESENCE_DEPTH[world.presence] ?? PRESENCE_DEPTH.ambient;
      const heat = clamp01(world.heat.composite);
      const interruption = clamp01(world.interruptionRisk);
      const atmosphereInfluence = clamp01(worldPresence.atmosphere.intensity);
      const opacity = clamp01(depth.opacity + heat * 0.26 + atmosphereInfluence * 0.12);
      const scale = depth.scale + heat * 0.08;
      const blurPx = depth.blur + (1 - interruption) * 1.8;
      const pulseOpacity = clamp01(0.08 + interruption * 0.3 + heat * 0.2);
      const pulseScale = 1 + interruption * 0.25 + heat * 0.12;
      const posX = 18 + (index % 2) * 56;
      const posY = 16 + index * 14;
      return <div key={world.worldId} className="absolute" style={{ left: `${posX}%`, top: `${posY}%`, transform: `translate(-50%, -50%) scale(${scale.toFixed(3)})` }}>
        <div className="rounded-[999px] border border-white/10 bg-white/[0.03]" style={{ width: `${220 + heat * 120}px`, height: `${100 + heat * 56}px`, opacity: opacity.toFixed(3), filter: `blur(${blurPx.toFixed(2)}px)` }} />
        <div className="absolute inset-0 rounded-[999px] border border-cyan-300/30" style={{ opacity: pulseOpacity.toFixed(3), transform: `scale(${pulseScale.toFixed(3)})`, transition: reducedMotion ? "none" : "transform 900ms ease-out, opacity 700ms ease-out" }} />
      </div>;
    })}
  </div>;
}
