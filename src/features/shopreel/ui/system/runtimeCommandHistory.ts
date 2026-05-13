export const RUNTIME_COMMAND_HISTORY_KEY = "shopreel-runtime-command-history-v1";

export type RuntimeCommandHistoryEntry = {
  id: string;
  timestamp: string;
  prompt: string;
  resolvedIntent: string;
  selectedRoute: string;
  transitionStatus: "executed" | "failed";
  outcomeSummary: string;
  carryoverWorldId: string | null;
};

const MAX_HISTORY = 40;

export function appendRuntimeCommandHistory(input: Omit<RuntimeCommandHistoryEntry, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  const current = readRuntimeCommandHistory();
  const next: RuntimeCommandHistoryEntry = { ...input, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
  const merged = [next, ...current].slice(0, MAX_HISTORY);
  window.localStorage.setItem(RUNTIME_COMMAND_HISTORY_KEY, JSON.stringify(merged));
}

export function readRuntimeCommandHistory(): RuntimeCommandHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RUNTIME_COMMAND_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
