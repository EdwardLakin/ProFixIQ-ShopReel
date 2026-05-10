import type { ShopReelPlatform } from "./types";

export type IntegrationLifecycleTruthState =
  | "implemented"
  | "partial"
  | "mock"
  | "planned"
  | "disabled";

export type IntegrationLifecycleTruth = {
  state: IntegrationLifecycleTruthState;
  label: string;
  publishReady: boolean;
  oauthReady: boolean;
  notes: string;
};

const TRUTH_MAP: Record<ShopReelPlatform, IntegrationLifecycleTruth> = {
  instagram: {
    state: "implemented",
    label: "Implemented",
    publishReady: true,
    oauthReady: true,
    notes: "OAuth and publish requests call Meta Graph endpoints.",
  },
  facebook: {
    state: "implemented",
    label: "Implemented",
    publishReady: true,
    oauthReady: true,
    notes: "OAuth and publish requests call Meta Graph endpoints.",
  },
  tiktok: {
    state: "planned",
    label: "Planned",
    publishReady: false,
    oauthReady: false,
    notes: "Publish and OAuth paths are not wired.",
  },
  youtube: {
    state: "planned",
    label: "Planned",
    publishReady: false,
    oauthReady: false,
    notes: "Publish and OAuth paths are not wired.",
  },
  blog: {
    state: "partial",
    label: "Partial",
    publishReady: false,
    oauthReady: false,
    notes: "Draft queue behavior exists but live publishing integration is not wired.",
  },
  linkedin: {
    state: "planned",
    label: "Planned",
    publishReady: false,
    oauthReady: false,
    notes: "Publish and OAuth paths are not wired.",
  },
  google_business: {
    state: "mock",
    label: "Mock",
    publishReady: false,
    oauthReady: false,
    notes: "Returns synthetic draft identifiers and queue-like responses.",
  },
  email: {
    state: "partial",
    label: "Partial",
    publishReady: false,
    oauthReady: false,
    notes: "Local queue/draft behavior exists; external publishing provider is not wired.",
  },
};

export function getIntegrationLifecycleTruth(platform: ShopReelPlatform): IntegrationLifecycleTruth {
  return TRUTH_MAP[platform];
}
