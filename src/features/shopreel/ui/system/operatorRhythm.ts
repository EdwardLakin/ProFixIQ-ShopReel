export type OperatorRhythmWorkingMode = "focused" | "exploratory" | "recovery" | "export_push" | "render_watch" | "campaign_build" | "dormant_return";
export type OperatorRhythmCadence = "calm" | "steady" | "compressed" | "urgent";
export type OperatorRhythmEventType = "route_changed" | "command_submitted" | "workflow_continued" | "render_checked" | "export_opened" | "campaign_opened" | "dormant_return" | "recovery_action";

export type OperatorRhythmEvent = { type: OperatorRhythmEventType; route?: string; timestamp: string };

export type OperatorRhythmSnapshot = {
  workingMode: OperatorRhythmWorkingMode;
  cadence: OperatorRhythmCadence;
  preferredSurface: string;
  interruptionTolerance: "low" | "medium" | "high";
  recoveryStyle: "resume_first" | "checkpointed" | "stabilize_then_move";
  prioritizationBias: "commands" | "renders" | "exports" | "campaigns" | "recovery";
  navigationDensity: "sparse" | "balanced" | "dense";
  commandSuggestionBias: "continue" | "render" | "export" | "campaign" | "recovery" | "explore";
  explanation: string[];
};

type OperatorRhythmMemory = { recentEvents: OperatorRhythmEvent[]; lastActiveAt: string };

const STORAGE_KEY = "shopreel-operator-rhythm-v1";
const MAX_EVENTS = 48;

const defaultMemory = (): OperatorRhythmMemory => ({ recentEvents: [], lastActiveAt: new Date(0).toISOString() });
const defaultSnapshot = (): OperatorRhythmSnapshot => ({
  workingMode: "focused",
  cadence: "calm",
  preferredSurface: "/shopreel",
  interruptionTolerance: "medium",
  recoveryStyle: "checkpointed",
  prioritizationBias: "commands",
  navigationDensity: "balanced",
  commandSuggestionBias: "continue",
  explanation: ["Rhythm bootstrapped from local activity history."],
});

export function readOperatorRhythmMemory(): OperatorRhythmMemory {
  if (typeof window === "undefined") return defaultMemory();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMemory();
    const parsed = JSON.parse(raw) as Partial<OperatorRhythmMemory>;
    return {
      recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents.slice(0, MAX_EVENTS) : [],
      lastActiveAt: typeof parsed.lastActiveAt === "string" ? parsed.lastActiveAt : new Date(0).toISOString(),
    };
  } catch {
    return defaultMemory();
  }
}

function writeOperatorRhythmMemory(memory: OperatorRhythmMemory): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...memory, recentEvents: memory.recentEvents.slice(0, MAX_EVENTS) }));
}

export function recordOperatorRhythmEvent(event: Omit<OperatorRhythmEvent, "timestamp"> & { timestamp?: string }): OperatorRhythmSnapshot {
  const memory = readOperatorRhythmMemory();
  const timestamp = event.timestamp ?? new Date().toISOString();
  const next: OperatorRhythmMemory = {
    recentEvents: [{ ...event, timestamp }, ...memory.recentEvents].slice(0, MAX_EVENTS),
    lastActiveAt: timestamp,
  };
  writeOperatorRhythmMemory(next);
  return deriveOperatorRhythmSnapshot(next);
}

function count(events: OperatorRhythmEvent[], type: OperatorRhythmEventType): number {
  return events.filter((event) => event.type === type).length;
}

export function deriveOperatorRhythmSnapshot(memory = readOperatorRhythmMemory()): OperatorRhythmSnapshot {
  const snapshot = defaultSnapshot();
  const events = memory.recentEvents;
  if (events.length === 0) return snapshot;
  const routeChanges = count(events, "route_changed");
  const commands = count(events, "command_submitted");
  const renderChecks = count(events, "render_checked");
  const exports = count(events, "export_opened");
  const campaigns = count(events, "campaign_opened");
  const recoveries = count(events, "workflow_continued") + count(events, "recovery_action");
  const gapHours = (Date.now() - new Date(memory.lastActiveAt).getTime()) / 3600000;

  const latestRoute = events.find((event) => event.route)?.route ?? "/shopreel";

  let workingMode: OperatorRhythmWorkingMode = "focused";
  if (gapHours >= 12 || count(events.slice(0, 4), "dormant_return") > 0) workingMode = "dormant_return";
  else if (renderChecks >= 3 && renderChecks >= exports && renderChecks >= campaigns) workingMode = "render_watch";
  else if (exports >= 3 && exports >= campaigns) workingMode = "export_push";
  else if (campaigns >= 3) workingMode = "campaign_build";
  else if (recoveries >= 3) workingMode = "recovery";
  else if (routeChanges >= 8) workingMode = "exploratory";

  const cadence: OperatorRhythmCadence = routeChanges >= 14 || commands >= 10 ? "urgent" : routeChanges >= 8 || commands >= 7 ? "compressed" : commands >= 3 ? "steady" : "calm";

  const commandSuggestionBias: OperatorRhythmSnapshot["commandSuggestionBias"] =
    workingMode === "render_watch" ? "render" :
    workingMode === "export_push" ? "export" :
    workingMode === "campaign_build" ? "campaign" :
    workingMode === "recovery" || workingMode === "dormant_return" ? "recovery" :
    workingMode === "exploratory" ? "explore" : "continue";

  return {
    workingMode,
    cadence,
    preferredSurface: latestRoute,
    interruptionTolerance: cadence === "urgent" ? "low" : cadence === "compressed" ? "medium" : "high",
    recoveryStyle: workingMode === "recovery" || workingMode === "dormant_return" ? "stabilize_then_move" : recoveries > 0 ? "resume_first" : "checkpointed",
    prioritizationBias: commandSuggestionBias === "render" ? "renders" : commandSuggestionBias === "export" ? "exports" : commandSuggestionBias === "campaign" ? "campaigns" : commandSuggestionBias === "recovery" ? "recovery" : "commands",
    navigationDensity: cadence === "urgent" ? "dense" : cadence === "calm" ? "sparse" : "balanced",
    commandSuggestionBias,
    explanation: [
      `Working mode ${workingMode.replace("_", " ")} derived from ${events.length} local events.`,
      `Cadence ${cadence} from ${commands} commands and ${routeChanges} route switches.`,
      `Preferred surface ${latestRoute} from most recent navigation context.`,
    ],
  };
}

export function reorderSuggestionsByRhythm(suggestions: string[], snapshot: OperatorRhythmSnapshot): string[] {
  const score = (input: string): number => {
    const item = input.toLowerCase();
    const weights: Record<string, number> = {
      render: /render|failed|queue|stabilize/.test(item) ? 4 : 0,
      export: /publish|export|package|schedule/.test(item) ? 4 : 0,
      campaign: /campaign|variation|audience/.test(item) ? 4 : 0,
      recovery: /continue|resume|restore|recovery/.test(item) ? 4 : 0,
      explore: /latest|open|review|show/.test(item) ? 3 : 0,
      continue: /continue|resume/.test(item) ? 3 : 0,
    };
    return weights[snapshot.commandSuggestionBias] ?? 0;
  };
  return [...suggestions].sort((a, b) => score(b) - score(a));
}
