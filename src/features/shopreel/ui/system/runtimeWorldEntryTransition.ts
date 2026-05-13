import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export const WORLD_ENTRY_TRANSITION_KEY = "shopreel-world-entry-transition-v1";
const TRANSITION_STALE_MS = 12_000;

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
    const parsed = JSON.parse(raw) as RuntimeWorldEntryTransitionState;
    const rect = parsed.snapshot?.rect;
    const hasSafeRect = rect
      && Number.isFinite(rect.x)
      && Number.isFinite(rect.y)
      && Number.isFinite(rect.width)
      && Number.isFinite(rect.height)
      && rect.width > 0
      && rect.height > 0;
    const hasHref = typeof parsed.snapshot?.href === "string" && parsed.snapshot.href.startsWith("/");
    const capturedAtMs = Number.isFinite(Date.parse(parsed.snapshot?.capturedAt ?? "")) ? Date.parse(parsed.snapshot.capturedAt) : NaN;
    const stale = !Number.isFinite(capturedAtMs) || Date.now() - capturedAtMs > TRANSITION_STALE_MS;

    if (!hasSafeRect || !hasHref || stale || parsed.phase === "complete") {
      clearWorldEntryTransition();
      return null;
    }

    return parsed;
  } catch {
    clearWorldEntryTransition();
    return null;
  }
}

export function clearWorldEntryTransition(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(WORLD_ENTRY_TRANSITION_KEY);
}
