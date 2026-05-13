import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeNavigationField = "forward" | "lateral" | "elevated" | "deep" | "stabilize";
export type RuntimeWorldRegion = "campaign_frontier" | "review_ridge" | "operations_lane" | "publish_front" | "archive_depths" | "runtime_mesh";

export type RuntimeWorldCoordinate = {
  x: number;
  y: number;
  z: number;
  region: RuntimeWorldRegion;
  field: RuntimeNavigationField;
};

export type RuntimeSpatialAnchor = {
  worldId: RuntimeWorldId;
  coordinate: RuntimeWorldCoordinate;
  adjacency: Partial<Record<"forward" | "backward" | "left" | "right" | "up" | "down", RuntimeWorldId>>;
  momentumBias: number;
  compression: number;
};

export type RuntimeWorldTopology = {
  anchors: Record<RuntimeWorldId, RuntimeSpatialAnchor>;
  continuityBias: number;
  atmosphericIdentity: string;
  adjacencyGraph: Record<RuntimeWorldId, RuntimeWorldId[]>;
};

const defaultAnchor = (worldId: RuntimeWorldId): RuntimeSpatialAnchor => ({
  worldId,
  coordinate: { x: 0, y: 0, z: 0, region: "runtime_mesh", field: "stabilize" },
  adjacency: {},
  momentumBias: 0.4,
  compression: 0.4,
});

export const RUNTIME_WORLD_TOPOLOGY: RuntimeWorldTopology = {
  continuityBias: 0.72,
  atmosphericIdentity: "shopreel_runtime",
  adjacencyGraph: {
    campaign: ["idea", "generation", "review", "operations"],
    idea: ["campaign", "upload", "operations"],
    upload: ["idea", "asset_library", "operations"],
    asset_library: ["upload", "generation", "operations"],
    generation: ["campaign", "asset_library", "review", "video_creation"],
    video_creation: ["generation", "review", "operations"],
    review: ["campaign", "generation", "render", "operations"],
    render: ["review", "publish", "operations"],
    publish: ["render", "calendar", "analytics", "operations"],
    calendar: ["publish", "analytics", "operations"],
    analytics: ["calendar", "idea", "operations"],
    automation: ["operations", "publish"],
    operations: ["campaign", "idea", "upload", "asset_library", "generation", "video_creation", "review", "render", "publish", "calendar", "analytics", "automation"],
  },
  anchors: {
    campaign: { worldId: "campaign", coordinate: { x: 0, y: 0.1, z: 1.3, region: "campaign_frontier", field: "forward" }, adjacency: { forward: "generation", right: "operations", up: "review", backward: "idea" }, momentumBias: 0.82, compression: 0.22 },
    review: { worldId: "review", coordinate: { x: 0.1, y: 0.85, z: 0.9, region: "review_ridge", field: "elevated" }, adjacency: { down: "campaign", forward: "render", left: "operations" }, momentumBias: 0.48, compression: 0.58 },
    operations: { worldId: "operations", coordinate: { x: -1.2, y: -0.05, z: 0.45, region: "operations_lane", field: "lateral" }, adjacency: { right: "campaign", forward: "publish", up: "review", down: "asset_library" }, momentumBias: 0.36, compression: 0.84 },
    asset_library: { worldId: "asset_library", coordinate: { x: -0.8, y: -0.7, z: -0.9, region: "archive_depths", field: "deep" }, adjacency: { up: "operations", forward: "generation", right: "upload" }, momentumBias: 0.24, compression: 0.46 },
    publish: { worldId: "publish", coordinate: { x: 0.65, y: 0.08, z: 1.65, region: "publish_front", field: "forward" }, adjacency: { backward: "render", left: "operations", right: "calendar", forward: "analytics" }, momentumBias: 0.76, compression: 0.32 },
    idea: { worldId: "idea", coordinate: { x: -0.2, y: -0.08, z: 0.25, region: "runtime_mesh", field: "stabilize" }, adjacency: { forward: "campaign", left: "operations", down: "upload" }, momentumBias: 0.52, compression: 0.35 },
    upload: { worldId: "upload", coordinate: { x: -0.72, y: -0.4, z: -0.22, region: "runtime_mesh", field: "deep" }, adjacency: { up: "idea", forward: "asset_library", right: "operations" }, momentumBias: 0.31, compression: 0.51 },
    generation: { worldId: "generation", coordinate: { x: 0.34, y: 0.14, z: 1.12, region: "campaign_frontier", field: "forward" }, adjacency: { backward: "campaign", up: "review", right: "video_creation", left: "operations" }, momentumBias: 0.76, compression: 0.3 },
    video_creation: { worldId: "video_creation", coordinate: { x: 0.82, y: 0.1, z: 1.05, region: "campaign_frontier", field: "forward" }, adjacency: { left: "generation", up: "review", backward: "campaign" }, momentumBias: 0.7, compression: 0.34 },
    render: { worldId: "render", coordinate: { x: 0.42, y: 0.42, z: 1.35, region: "publish_front", field: "forward" }, adjacency: { backward: "review", forward: "publish", left: "operations" }, momentumBias: 0.78, compression: 0.28 },
    calendar: { worldId: "calendar", coordinate: { x: 1.06, y: -0.06, z: 1.25, region: "publish_front", field: "lateral" }, adjacency: { left: "publish", forward: "analytics", backward: "render" }, momentumBias: 0.58, compression: 0.4 },
    analytics: { worldId: "analytics", coordinate: { x: 1.15, y: -0.32, z: 0.55, region: "archive_depths", field: "deep" }, adjacency: { up: "publish", backward: "calendar", left: "operations" }, momentumBias: 0.4, compression: 0.62 },
    automation: { worldId: "automation", coordinate: { x: -1.45, y: 0.04, z: 0.32, region: "operations_lane", field: "lateral" }, adjacency: { right: "operations", forward: "publish" }, momentumBias: 0.33, compression: 0.78 },
  },
};
