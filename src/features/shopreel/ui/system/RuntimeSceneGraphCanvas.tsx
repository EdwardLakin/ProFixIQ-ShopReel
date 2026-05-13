"use client";

import type { CSSProperties } from "react";
import type { RuntimeSceneComposition } from "@/features/shopreel/ui/system/runtimeSceneGraph";
import type { RuntimeScenePlane } from "@/features/shopreel/ui/system/runtimePlaneGeometry";

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

export function RuntimeSceneGraphCanvas({ composition, planesByDepth }: { composition: RuntimeSceneComposition; planesByDepth: Record<string, RuntimeScenePlane> }) {
  return <section className="relative z-20 min-h-[72vh]" style={{ perspective: "1700px", transformStyle: "preserve-3d" }}>
    {composition.nodes.map((node) => {
      const plane = planesByDepth[node.id] ?? planesByDepth.midground;
      return <div key={node.id} className={`absolute inset-0 flex ${anchorClass[plane.relationship.anchor] ?? anchorClass.center}`} style={renderPlaneStyle(plane, composition.state.reducedMotion)}>
        <div className="w-full px-4 md:px-6">{node.content}</div>
      </div>;
    })}
  </section>;
}
