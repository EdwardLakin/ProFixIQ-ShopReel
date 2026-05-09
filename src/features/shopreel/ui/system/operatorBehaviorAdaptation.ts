export type OperatorBehaviorEventType =
  | "command_submitted"
  | "route_changed"
  | "workflow_continued"
  | "recovery_opened"
  | "render_checked"
  | "export_opened"
  | "campaign_opened"
  | "create_opened"
  | "review_opened"
  | "blocker_seen"
  | "continuity_restored"
  | "dormant_return";

export type OperatorBehaviorEvent = {
  type: OperatorBehaviorEventType;
  route?: string;
  intent?: string;
  timestamp: string;
};

export type OperatorMode = "creator" | "reviewer" | "recovery_operator" | "render_monitor" | "campaign_strategist" | "exporter" | "continuity_restorer" | "explorer" | "dormant_return";
export type PriorityBias = "create" | "review" | "render" | "export" | "campaign" | "recovery" | "continuity";

export type OperatorBehaviorMemory = {
  recentEvents: OperatorBehaviorEvent[];
  routeFrequency: Record<string, number>;
  commandPatterns: Record<string, number>;
  recoveryCount: number;
  exportCount: number;
  renderCheckCount: number;
  campaignCount: number;
  createCount: number;
  interruptionCount: number;
  continuationCount: number;
  blockerEncounterCount: number;
  lastActiveAt: string;
  preferredWorkflowBias: PriorityBias;
  recoveryStyle: "proactive" | "steady" | "intensive";
  prioritizationStyle: "creation_first" | "render_first" | "campaign_first" | "recovery_first" | "balanced";
  continuityStyle: "stable" | "fractured" | "restorative";
  navigationStyle: "spacious" | "balanced" | "compressed";
  explanation: string[];
};

export type OperatorAdaptationSnapshot = {
  operatorMode: OperatorMode;
  priorityBias: PriorityBias;
  densityPreference: "spacious" | "balanced" | "compressed";
  continuitySensitivity: "low" | "normal" | "high";
  escalationTolerance: "low" | "normal" | "high";
  recoveryBias: "soften" | "stabilize" | "accelerate";
  navigationBias: "routes" | "workflow" | "command" | "compact";
  suggestedNextMove: string;
  environmentalAdjustment: string;
  explanation: string[];
};

const STORAGE_KEY = "shopreel-operator-behavior-v1";
const MAX_EVENTS = 40;

const defaultMemory = (): OperatorBehaviorMemory => ({
  recentEvents: [], routeFrequency: {}, commandPatterns: {}, recoveryCount: 0, exportCount: 0, renderCheckCount: 0, campaignCount: 0, createCount: 0,
  interruptionCount: 0, continuationCount: 0, blockerEncounterCount: 0, lastActiveAt: new Date(0).toISOString(), preferredWorkflowBias: "continuity",
  recoveryStyle: "steady", prioritizationStyle: "balanced", continuityStyle: "stable", navigationStyle: "balanced", explanation: ["No operator behavior memory yet."]
});

export function readOperatorBehaviorMemory(): OperatorBehaviorMemory {
  if (typeof window === "undefined") return defaultMemory();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMemory();
    const parsed = JSON.parse(raw) as Partial<OperatorBehaviorMemory>;
    return { ...defaultMemory(), ...parsed, recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents.slice(0, MAX_EVENTS) : [] };
  } catch {
    return defaultMemory();
  }
}

export function writeOperatorBehaviorMemory(memory: OperatorBehaviorMemory): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...memory, recentEvents: memory.recentEvents.slice(0, MAX_EVENTS) }));
}

export function recordOperatorBehaviorEvent(event: Omit<OperatorBehaviorEvent, "timestamp"> & { timestamp?: string }): OperatorBehaviorMemory {
  const memory = readOperatorBehaviorMemory();
  const timestamp = event.timestamp ?? new Date().toISOString();
  const next: OperatorBehaviorMemory = { ...memory, recentEvents: [{ ...event, timestamp }, ...memory.recentEvents].slice(0, MAX_EVENTS), lastActiveAt: timestamp, explanation: [] };
  if (event.route) next.routeFrequency[event.route] = (next.routeFrequency[event.route] ?? 0) + 1;
  if (event.intent) next.commandPatterns[event.intent] = (next.commandPatterns[event.intent] ?? 0) + 1;
  if (event.type === "recovery_opened") next.recoveryCount += 1;
  if (event.type === "export_opened") next.exportCount += 1;
  if (event.type === "render_checked") next.renderCheckCount += 1;
  if (event.type === "campaign_opened") next.campaignCount += 1;
  if (event.type === "create_opened") next.createCount += 1;
  if (event.type === "workflow_continued") next.continuationCount += 1;
  if (event.type === "blocker_seen") next.blockerEncounterCount += 1;
  if (event.type === "dormant_return") next.interruptionCount += 1;
  next.preferredWorkflowBias = derivePreferredBias(next);
  next.navigationStyle = deriveNavigationStyle(next);
  next.continuityStyle = next.blockerEncounterCount > next.continuationCount ? "fractured" : next.continuationCount > 2 ? "restorative" : "stable";
  next.recoveryStyle = next.recoveryCount > 4 ? "intensive" : next.recoveryCount > 1 ? "proactive" : "steady";
  next.prioritizationStyle = biasToPrioritization(next.preferredWorkflowBias);
  next.explanation = explainOperatorAdaptation(next);
  writeOperatorBehaviorMemory(next);
  return next;
}

function derivePreferredBias(memory: OperatorBehaviorMemory): PriorityBias {
  const scores: Record<PriorityBias, number> = {
    create: memory.createCount,
    review: countEvents(memory, "review_opened"),
    render: memory.renderCheckCount,
    export: memory.exportCount,
    campaign: memory.campaignCount,
    recovery: memory.recoveryCount,
    continuity: memory.continuationCount,
  };
  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] as PriorityBias) ?? "continuity";
}

function deriveNavigationStyle(memory: OperatorBehaviorMemory): "spacious" | "balanced" | "compressed" {
  const switches = countEvents(memory, "route_changed");
  if (switches >= 20) return "compressed";
  if (switches >= 10) return "balanced";
  return "spacious";
}

function countEvents(memory: OperatorBehaviorMemory, type: OperatorBehaviorEventType): number {
  return memory.recentEvents.filter((event) => event.type === type).length;
}

function biasToPrioritization(bias: PriorityBias): OperatorBehaviorMemory["prioritizationStyle"] {
  if (bias === "create") return "creation_first";
  if (bias === "render") return "render_first";
  if (bias === "campaign") return "campaign_first";
  if (bias === "recovery") return "recovery_first";
  return "balanced";
}

export function deriveOperatorAdaptation(memory: OperatorBehaviorMemory, globalState?: { dormantInfluence?: number; continuityFracture?: number; renderInstability?: number }): OperatorAdaptationSnapshot {
  const dormantMs = Date.now() - new Date(memory.lastActiveAt).getTime();
  const dormantHours = dormantMs / 3600000;
  const isDormant = dormantHours >= 18;
  const operatorMode: OperatorMode = isDormant ? "dormant_return" : memory.preferredWorkflowBias === "create" ? "creator" : memory.preferredWorkflowBias === "review" ? "reviewer" : memory.preferredWorkflowBias === "render" ? "render_monitor" : memory.preferredWorkflowBias === "export" ? "exporter" : memory.preferredWorkflowBias === "campaign" ? "campaign_strategist" : memory.preferredWorkflowBias === "recovery" ? "recovery_operator" : memory.continuityStyle === "restorative" ? "continuity_restorer" : "explorer";
  const continuitySensitivity = memory.continuityStyle === "fractured" || (globalState?.continuityFracture ?? 0) > 55 ? "high" : memory.continuityStyle === "restorative" ? "normal" : "low";
  const escalationTolerance = memory.blockerEncounterCount > memory.continuationCount ? "low" : memory.continuationCount > 5 ? "high" : "normal";
  const snapshot: OperatorAdaptationSnapshot = {
    operatorMode,
    priorityBias: memory.preferredWorkflowBias,
    densityPreference: memory.navigationStyle,
    continuitySensitivity,
    escalationTolerance,
    recoveryBias: memory.recoveryStyle === "intensive" ? "accelerate" : memory.recoveryStyle === "proactive" ? "stabilize" : "soften",
    navigationBias: memory.navigationStyle === "compressed" ? "compact" : memory.preferredWorkflowBias === "continuity" ? "workflow" : memory.preferredWorkflowBias === "create" ? "command" : "routes",
    suggestedNextMove: nextMove(memory.preferredWorkflowBias),
    environmentalAdjustment: isDormant ? "cooling and reduced urgency" : memory.blockerEncounterCount > memory.continuationCount ? "increase friction visibility and attention cues" : memory.continuationCount > memory.blockerEncounterCount ? "restore calm faster after continuation" : "maintain balanced production rhythm",
    explanation: explainOperatorAdaptation(memory),
  };
  return snapshot;
}

function nextMove(bias: PriorityBias): string {
  if (bias === "export") return "Open publish queue and package ready outputs.";
  if (bias === "render") return "Check render status and resolve high-impact failures.";
  if (bias === "campaign") return "Advance active campaign sequencing.";
  if (bias === "create") return "Resume creation flow from latest draft.";
  if (bias === "recovery") return "Continue recovery corridor checkpoints.";
  if (bias === "review") return "Review unresolved scenes and approvals.";
  return "Continue last workflow thread and stabilize continuity.";
}

export function explainOperatorAdaptation(memory: OperatorBehaviorMemory): string[] {
  return [
    `Operator pattern: ${memory.preferredWorkflowBias.replace("_", " ")} priority bias from ${memory.recentEvents.length} recent events.`,
    `Recovery tendency: ${memory.recoveryStyle} with ${memory.recoveryCount} recovery events and ${memory.continuationCount} continuation events.`,
    `Production rhythm: ${memory.navigationStyle} navigation with ${countEvents(memory, "route_changed")} route transitions.`,
  ];
}
