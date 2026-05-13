export const RUNTIME_ENVIRONMENT_KEY = "shopreel-runtime-environment-v1";

export type RuntimeEnvironmentalState = {
  topologyPressure: number;
  chamberRhythm: number;
  focalContinuity: number;
  operationalFatigue: number;
  narrativeMomentum: number;
  updatedAt: string;
};

export function persistRuntimeEnvironment(state: Omit<RuntimeEnvironmentalState, "updatedAt">) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RUNTIME_ENVIRONMENT_KEY, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }));
}

export function readRuntimeEnvironment(): RuntimeEnvironmentalState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(RUNTIME_ENVIRONMENT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as RuntimeEnvironmentalState; } catch { return null; }
}
