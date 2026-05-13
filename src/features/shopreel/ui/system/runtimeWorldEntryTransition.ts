import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export const WORLD_ENTRY_TRANSITION_KEY = "shopreel-world-entry-transition-v1";

export type RuntimeWorldEntrySnapshot = {
  worldId: RuntimeWorldId;
  href: string;
  title: string;
  worldKind: string;
  visualSeed: string;
  rect: { x: number; y: number; width: number; height: number };
  capturedAt: string;
};

export type RuntimeWorldEntryTransitionState = {
  snapshot: RuntimeWorldEntrySnapshot;
  reducedMotion: boolean;
  phase: "captured" | "navigating" | "arrived" | "complete";
};

export function persistWorldEntryTransition(state: RuntimeWorldEntryTransitionState): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(WORLD_ENTRY_TRANSITION_KEY, JSON.stringify(state));
}

export function readWorldEntryTransition(): RuntimeWorldEntryTransitionState | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(WORLD_ENTRY_TRANSITION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RuntimeWorldEntryTransitionState;
  } catch {
    return null;
  }
}

export function clearWorldEntryTransition(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(WORLD_ENTRY_TRANSITION_KEY);
}
