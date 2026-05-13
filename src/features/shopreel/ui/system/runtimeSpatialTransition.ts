import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

const SPATIAL_TRANSITION_KEY = "shopreel-runtime-spatial-transition-v1";
const RETURN_TRANSITION_KEY = "shopreel-runtime-spatial-return-v1";

export type RuntimeCameraState = "docked" | "entering" | "focusing" | "immersed" | "recovering" | "returning";

export type RuntimeAtmosphereSeed = {
  tone: "calm" | "focused" | "elevated" | "critical";
  gradientSeed: string;
  continuityRailOffset: number;
  orchestrationPressureTone: "steady" | "watch" | "urgent";
  temporalResilience: "stable" | "volatile" | "recovering";
  graphStressIntensity: number;
};

export type RuntimeSpatialSnapshot = {
  worldId: RuntimeWorldId;
  href: string;
  title: string;
  cardRect: { x: number; y: number; width: number; height: number };
  atmosphere: RuntimeAtmosphereSeed;
  operatorPriorityContext: { rank: number; unresolvedCount: number; hasBlocker: boolean };
  capturedAt: string;
};

export type RuntimeFocusTransfer = {
  deckOpacity: number;
  shellOpacity: number;
  panelReveal: number;
  continuityRailFocus: number;
};

export type RuntimeSpatialTransitionState = {
  snapshot: RuntimeSpatialSnapshot;
  reducedMotion: boolean;
  camera: RuntimeCameraState;
  focus: RuntimeFocusTransfer;
  phase: "captured" | "navigating" | "arrived" | "complete";
};

export function persistRuntimeSpatialTransition(state: RuntimeSpatialTransitionState): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SPATIAL_TRANSITION_KEY, JSON.stringify(state));
}

export function readRuntimeSpatialTransition(): RuntimeSpatialTransitionState | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SPATIAL_TRANSITION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as RuntimeSpatialTransitionState; } catch { return null; }
}

export function clearRuntimeSpatialTransition(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SPATIAL_TRANSITION_KEY);
}

export function persistRuntimeReturnState(input: { worldId: RuntimeWorldId; scrollY: number; restoreCardId: string; returnedAt: string }): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(RETURN_TRANSITION_KEY, JSON.stringify(input));
}

export function consumeRuntimeReturnState(): { worldId: RuntimeWorldId; scrollY: number; restoreCardId: string; returnedAt: string } | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(RETURN_TRANSITION_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(RETURN_TRANSITION_KEY);
  try { return JSON.parse(raw) as { worldId: RuntimeWorldId; scrollY: number; restoreCardId: string; returnedAt: string }; } catch { return null; }
}

export function deriveFocusTransfer(camera: RuntimeCameraState, reducedMotion: boolean): RuntimeFocusTransfer {
  if (reducedMotion) return { deckOpacity: 0, shellOpacity: 1, panelReveal: 1, continuityRailFocus: 1 };
  switch (camera) {
    case "docked": return { deckOpacity: 1, shellOpacity: 0, panelReveal: 0, continuityRailFocus: 0.2 };
    case "entering": return { deckOpacity: 0.65, shellOpacity: 0.45, panelReveal: 0.2, continuityRailFocus: 0.4 };
    case "focusing": return { deckOpacity: 0.35, shellOpacity: 0.75, panelReveal: 0.55, continuityRailFocus: 0.7 };
    case "immersed": return { deckOpacity: 0, shellOpacity: 1, panelReveal: 1, continuityRailFocus: 1 };
    case "recovering": return { deckOpacity: 0.2, shellOpacity: 0.85, panelReveal: 0.85, continuityRailFocus: 0.9 };
    case "returning": return { deckOpacity: 0.5, shellOpacity: 0.5, panelReveal: 0.4, continuityRailFocus: 0.5 };
  }
}
