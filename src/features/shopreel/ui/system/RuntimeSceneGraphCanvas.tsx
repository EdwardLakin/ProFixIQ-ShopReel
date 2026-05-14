"use client";

import type { CSSProperties } from "react";
import type { RuntimeContinuityMemory } from "@/features/shopreel/ui/system/runtimeContinuityMemory";
import type { RuntimeInteractionTopology } from "@/features/shopreel/ui/system/runtimeInteractionTopology";
import type { RuntimePresenceLayer } from "@/features/shopreel/ui/system/runtimePresenceLayer";
import type { RuntimeSceneComposition } from "@/features/shopreel/ui/system/runtimeSceneGraph";
import type { RuntimeTopologyField } from "@/features/shopreel/ui/system/runtimeTopologyField";
import type { RuntimeScenePlane } from "@/features/shopreel/ui/system/runtimePlaneGeometry";
import type { RuntimeWorldTopologyState } from "@/features/shopreel/ui/system/runtimeWorldTopology";
import { RuntimeEnvironmentalFieldLayer } from "@/features/shopreel/ui/system/RuntimeEnvironmentalFieldLayer";
import { RuntimePresenceRenderLayer } from "@/features/shopreel/ui/system/RuntimePresenceRenderLayer";
import { RuntimeWorldTopologyLayer } from "@/features/shopreel/ui/system/RuntimeWorldTopologyLayer";
import type { RuntimeSpatialOrchestrationState } from "@/features/shopreel/ui/system/runtimeSpatialOrchestrator";

const anchorClass: Record<string, string> = {
  center: "items-center justify-center",
  north: "items-start justify-center",
  south: "items-end justify-center",
  east: "items-center justify-end",
  west: "items-center justify-start",
  "north-east": "items-start justify-end",
  "north-west": "items-start justify-start",
  "south-east": "items-end justify-end",
  "south-west": "items-end justify-start",
};

function renderPlaneStyle(plane: RuntimeScenePlane, reducedMotion: boolean): CSSProperties {
  const axis = plane.field.chamberAxis;
  const continuity = plane.field.continuityOffset;
  const drift = plane.field.topologyDrift;
  const parallax = plane.parallax.vector;
  const tx = (axis.x + continuity.x + drift.x + parallax.x) * 84;
  const ty = (axis.y + continuity.y + drift.y + parallax.y) * 76;
  const tz = (axis.z + continuity.z + drift.z + parallax.z) * 300;
  return {
    zIndex: plane.focusPriority,
    pointerEvents: plane.interactionMode === "background_action" ? "none" : "auto",
    opacity: plane.attenuation.opacity,
    filter: `blur(${plane.attenuation.blur}px)`,
    transform: reducedMotion ? "none" : `translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${plane.perspective.tiltDeg}deg) rotateY(${plane.perspective.yawDeg}deg) rotateZ(${plane.perspective.rollDeg}deg) scale(${plane.perspective.scale * plane.field.environmentalScale})`,
  };
}

export function RuntimeSceneGraphCanvas({ composition, planesByDepth, topologyField, interactionTopology, presenceLayer, continuityMemory, worldTopology, spatialOrchestration }: { composition: RuntimeSceneComposition; planesByDepth: Record<string, RuntimeScenePlane>; topologyField: RuntimeTopologyField; interactionTopology: RuntimeInteractionTopology; presenceLayer: RuntimePresenceLayer; continuityMemory: RuntimeContinuityMemory; worldTopology: RuntimeWorldTopologyState; spatialOrchestration: RuntimeSpatialOrchestrationState }) {
  const isCampaignWorld = worldTopology.foregroundWorldId === "campaign";
  return <section className="relative z-20 min-h-[72vh] overflow-x-clip overflow-y-visible px-2 pb-24 pt-10 md:px-6 pointer-events-none" style={{ perspective: "1700px", transformStyle: "preserve-3d" }} data-continuity-corridor={topologyField.continuityCorridor.strength.toFixed(2)} data-guidance-density={presenceLayer.atmosphere.density.toFixed(2)}>
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {!isCampaignWorld ? <><RuntimeEnvironmentalFieldLayer spatial={spatialOrchestration} reducedMotion={composition.state.reducedMotion} />
      <RuntimeWorldTopologyLayer topology={worldTopology} reducedMotion={composition.state.reducedMotion} />
      <RuntimePresenceRenderLayer topology={worldTopology} reducedMotion={composition.state.reducedMotion} />
      <div className="absolute left-1/2 top-0 h-20 w-[34rem] -translate-x-1/2 rounded-b-[100%] border border-cyan-200/25 bg-cyan-300/8 blur-[1px]" />
      <div className="absolute inset-x-[5%] top-[8%] h-[30%] rounded-[999px] bg-cyan-400/8 blur-3xl" />
      <div className="absolute inset-x-[10%] bottom-[15%] h-[24%] rounded-[999px] bg-indigo-400/10 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(180deg,rgba(2,6,23,0)_0%,rgba(2,6,23,.62)_44%,rgba(2,6,23,.94)_100%)]" />
      <div className="absolute bottom-[10%] left-[8%] h-24 w-40 rounded-[40%] border border-white/10 bg-white/[0.03] blur-[1px]" />
      <div className="absolute bottom-[16%] right-[10%] h-28 w-48 rounded-[45%] border border-white/10 bg-white/[0.02] blur-[1px]" />
      <div className="absolute bottom-[3%] left-1/2 h-28 w-[40rem] max-w-[92vw] -translate-x-1/2 rounded-[100%] border border-cyan-300/20 bg-cyan-300/8 blur-[1px]" /></> : <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.55)_100%)]" />}
    </div>
    {composition.nodes.map((node) => {
      const plane = planesByDepth[node.id] ?? planesByDepth.midground ?? planesByDepth.foreground ?? Object.values(planesByDepth)[0];
      if (!plane) return null;
      return <div key={node.id} data-embodied-weight={node.embodiedWeight.toFixed(2)} data-pressure-weight={node.pressureWeight.toFixed(2)} data-continuity-weight={node.continuityWeight.toFixed(2)} data-recovery-weight={node.recoveryWeight.toFixed(2)} data-entity-density={node.entityDensity.toFixed(2)} data-focal-gravity={node.focalGravity.toFixed(2)} data-chamber-presence={node.chamberPresence.toFixed(2)} data-topology-zone={topologyField.interactionZones.find((zone) => zone.nodeId === node.id)?.type ?? "recessed"} className={`absolute inset-0 flex ${anchorClass[plane.relationship.anchor] ?? anchorClass.center}`} style={{ ...renderPlaneStyle(plane, composition.state.reducedMotion), opacity: plane.attenuation.opacity * node.attenuation }}>
        <div className="w-full max-w-[100vw] px-3 md:px-5">{node.content}</div>
      </div>;
    })}
    <div className="sr-only" aria-live="polite">{`${interactionTopology.summary}; operator signal ${presenceLayer.atmosphere.signal}; trajectory ${continuityMemory.activeTrajectory.direction}`}</div>
  </section>;
}
