import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeOperatorPosition = {
  worldId: RuntimeWorldId;
  previousWorldId: RuntimeWorldId | null;
  focusDirection: "forward" | "lateral" | "elevated" | "deep" | "stabilize";
  continuityState: "stable" | "recovering" | "interrupted";
  at: string;
};

const KEY = "shopreel.runtime.operatorPosition.v1";

export function readRuntimeOperatorPosition(): RuntimeOperatorPosition | null {
  if (typeof window === "undefined") return null;
  try { const raw = window.localStorage.getItem(KEY); return raw ? JSON.parse(raw) as RuntimeOperatorPosition : null; } catch { return null; }
}

export function persistRuntimeOperatorPosition(position: RuntimeOperatorPosition) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(position));
}
