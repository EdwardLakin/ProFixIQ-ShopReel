"use client";

import type { RuntimeSceneComposition } from "@/features/shopreel/ui/system/runtimeSceneGraph";

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

export function RuntimeSceneGraphCanvas({ composition }: { composition: RuntimeSceneComposition }) {
  return <section className="relative z-20 min-h-[72vh]" style={{ perspective: "1700px" }}>
    {composition.nodes.map((node, index) => <div key={node.id} className={`absolute inset-0 flex ${anchorClass[node.anchor] ?? anchorClass.center}`} style={{ zIndex: 20 + index, pointerEvents: node.pointerEvents, opacity: node.opacity, filter: node.blur > 0 ? `blur(${node.blur}px)` : "none", transform: composition.state.reducedMotion ? "none" : `translate3d(${node.vector.x * 60}px, ${node.vector.y * 55}px, ${node.vector.z * 260}px) scale(${node.scale})` }}>
      <div className="w-full max-w-[96rem] px-4 md:px-6">{node.content}</div>
    </div>)}
  </section>;
}
