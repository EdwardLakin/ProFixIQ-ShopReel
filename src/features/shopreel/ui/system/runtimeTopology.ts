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
  anchors: {
    campaign: { worldId: "campaign", coordinate: { x: 0, y: 0.1, z: 1.3, region: "campaign_frontier", field: "forward" }, adjacency: { forward: "generation", right: "operations", up: "review", backward: "idea" }, momentumBias: 0.82, compression: 0.22 },
    review: { worldId: "review", coordinate: { x: 0.1, y: 0.85, z: 0.9, region: "review_ridge", field: "elevated" }, adjacency: { down: "campaign", forward: "render", left: "operations" }, momentumBias: 0.48, compression: 0.58 },
    operations: { worldId: "operations", coordinate: { x: -1.2, y: -0.05, z: 0.45, region: "operations_lane", field: "lateral" }, adjacency: { right: "campaign", forward: "publish", up: "review", down: "asset_library" }, momentumBias: 0.36, compression: 0.84 },
    asset_library: { worldId: "asset_library", coordinate: { x: -0.8, y: -0.7, z: -0.9, region: "archive_depths", field: "deep" }, adjacency: { up: "operations", forward: "generation", right: "upload" }, momentumBias: 0.24, compression: 0.46 },
    publish: { worldId: "publish", coordinate: { x: 0.65, y: 0.08, z: 1.65, region: "publish_front", field: "forward" }, adjacency: { backward: "render", left: "operations", right: "calendar", forward: "analytics" }, momentumBias: 0.76, compression: 0.32 },
    idea: defaultAnchor("idea"),
    upload: defaultAnchor("upload"),
    generation: defaultAnchor("generation"),
    video_creation: defaultAnchor("video_creation"),
    render: defaultAnchor("render"),
    calendar: defaultAnchor("calendar"),
    analytics: defaultAnchor("analytics"),
    automation: defaultAnchor("automation"),
  },
};
