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
  const t = plane.transform;
  return {
    zIndex: plane.focusPriority,
    pointerEvents: plane.interactionMode === "background_action" ? "none" : "auto",
    opacity: t.opacity,
    filter: t.blur > 0 ? `blur(${t.blur}px)` : "none",
    transform: reducedMotion ? "none" : `translate3d(${(t.origin.x + t.parallaxVector.x) * 72}px, ${(t.origin.y + t.parallaxVector.y) * 65}px, ${t.origin.z * 320}px) rotateZ(${t.rotationBiasDeg}deg) scale(${t.scale})`,
  };
}

export function RuntimeSceneGraphCanvas({ composition, planesByDepth }: { composition: RuntimeSceneComposition; planesByDepth: Record<string, RuntimeScenePlane> }) {
  return <section className="relative z-20 min-h-[72vh]" style={{ perspective: "1700px", transformStyle: "preserve-3d" }}>
    {composition.nodes.map((node) => {
      const plane = planesByDepth[node.id] ?? planesByDepth.midground;
      return <div key={node.id} className={`absolute inset-0 flex ${anchorClass[plane.transform.anchor] ?? anchorClass.center}`} style={renderPlaneStyle(plane, composition.state.reducedMotion)}>
        <div className="w-full px-4 md:px-6">{node.content}</div>
      </div>;
    })}
  </section>;
}
