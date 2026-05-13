import type { RuntimeEntityGraph } from "@/features/shopreel/ui/system/runtimeEntityGraph";
import type { RuntimeWorldChoreography } from "@/features/shopreel/ui/system/runtimeWorldChoreography";
import type { RuntimeWorldOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeTemporalEventKind = "transition" | "interruption" | "recovery" | "blocker" | "stalled" | "lifecycle" | "checkpoint";
export type RuntimeInterruptionSeverity = "low" | "moderate" | "high" | "critical";
export type RuntimeDecayState = "stable" | "aging" | "degrading" | "stalled";
export type RuntimeOperationalVolatility = "steady" | "variable" | "volatile" | "severe";
export type RuntimeContinuityResilience = "strong" | "moderate" | "fragile" | "critical";

export type RuntimeTemporalEvent = { id: string; worldId: RuntimeWorldId | null; at: string; kind: RuntimeTemporalEventKind; label: string; detail: string | null; source: string; severity: RuntimeInterruptionSeverity };
export type RuntimeTemporalSequence = { worldId: RuntimeWorldId; events: RuntimeTemporalEvent[]; firstAt: string | null; lastAt: string | null; unresolvedInterruptions: number };
export type RuntimeTemporalWindow = { startedAt: string | null; endedAt: string | null; ageMinutes: number; stalledMinutes: number; eventCount: number };
export type RuntimeOperationalEpoch = { worldId: RuntimeWorldId; phase: "created" | "active" | "blocked" | "recovery" | "resolved"; startedAt: string | null; endedAt: string | null };
export type RuntimeInterruptionEvent = { eventId: string; worldId: RuntimeWorldId; source: string; severity: RuntimeInterruptionSeverity; startedAt: string; durationMinutes: number; unresolved: boolean };
export type RuntimeRecoveryEvent = { eventId: string; worldId: RuntimeWorldId; pathway: string; startedAt: string; succeeded: boolean; fromInterruptionId: string | null };
export type RuntimeWorkflowLifecycle = { worldId: RuntimeWorldId; stages: string[]; lastStablePoint: string | null; workflowAgeMinutes: number };
export type RuntimeTemporalTransition = { from: RuntimeWorldId | null; to: RuntimeWorldId; at: string; reason: string | null };
export type RuntimeTemporalSnapshot = { at: string; worldId: RuntimeWorldId; flowHealth: string; pressure: string; unresolvedCount: number };
export type RuntimeTemporalCheckpoint = { id: string; at: string; worldId: RuntimeWorldId; label: string; stable: boolean };

export type RuntimeTemporalMemory = {
  events: RuntimeTemporalEvent[];
  sequences: RuntimeTemporalSequence[];
  window: RuntimeTemporalWindow;
  epochs: RuntimeOperationalEpoch[];
  interruptions: RuntimeInterruptionEvent[];
  recoveries: RuntimeRecoveryEvent[];
  lifecycle: RuntimeWorkflowLifecycle[];
  transitions: RuntimeTemporalTransition[];
  snapshots: RuntimeTemporalSnapshot[];
  checkpoints: RuntimeTemporalCheckpoint[];
  volatility: RuntimeOperationalVolatility;
  resilience: RuntimeContinuityResilience;
  decayState: RuntimeDecayState;
};

type Input = { now: string; activeWorldId: RuntimeWorldId; status: string; unresolvedCount: number; blockers: string[]; breadcrumbs: Array<{ worldId: RuntimeWorldId | null; at?: string; label?: string }>; transitionHistory: Array<{ from: RuntimeWorldId | null; to: RuntimeWorldId; at: string; reason: string }>; orchestration?: RuntimeWorldOrchestration | null; choreography?: RuntimeWorldChoreography | null; entityGraph?: RuntimeEntityGraph | null };
const sev=(n:number):RuntimeInterruptionSeverity=>n>4?"critical":n>2?"high":n>0?"moderate":"low";
const mins=(a:string,b:string)=>Math.max(0,Math.floor((new Date(b).getTime()-new Date(a).getTime())/60000));

export function deriveTemporalTransitions(input: Input): RuntimeTemporalTransition[] { return input.transitionHistory.map((h) => ({ from: h.from, to: h.to, at: h.at, reason: h.reason })); }
export function deriveTemporalEvents(input: Input): RuntimeTemporalEvent[] {
  const base = deriveTemporalTransitions(input).map((t, i) => ({ id: `evt-transition-${i}-${t.to}`, worldId: t.to, at: t.at, kind: "transition" as const, label: `${t.from ?? "deck"} → ${t.to}`, detail: t.reason, source: "runtimeWorldTransition", severity: "low" as const }));
  const blocker = input.blockers.map((b, i) => ({ id: `evt-blocker-${i}`, worldId: input.activeWorldId, at: input.now, kind: "blocker" as const, label: "Blocker active", detail: b, source: "runtimeEntityGraph", severity: "high" as const }));
  return [...base, ...blocker].sort((a,b)=>a.at.localeCompare(b.at));
}
export function deriveOperationalEpochs(events: RuntimeTemporalEvent[], activeWorldId: RuntimeWorldId): RuntimeOperationalEpoch[] { return [{ worldId: activeWorldId, phase: "active", startedAt: events[0]?.at ?? null, endedAt: events.at(-1)?.at ?? null }]; }
export function deriveInterruptionEvents(events: RuntimeTemporalEvent[], now: string): RuntimeInterruptionEvent[] { return events.filter((e)=>e.kind==="blocker").map((e)=>({ eventId:e.id, worldId:e.worldId ?? "campaign", source:e.source, severity:e.severity, startedAt:e.at, durationMinutes:mins(e.at,now), unresolved:true })); }
export function deriveRecoveryEvents(input: Input, interruptions: RuntimeInterruptionEvent[]): RuntimeRecoveryEvent[] { if ((input.orchestration?.recoveryState.needsRecovery ?? false) === false) return []; return [{ eventId:`recovery-${input.activeWorldId}`, worldId:input.activeWorldId, pathway:input.orchestration?.recoveryState.hint ?? "manual recovery", startedAt:input.now, succeeded:input.orchestration?.flowHealth==="resolved", fromInterruptionId:interruptions.at(-1)?.eventId ?? null }]; }
export function deriveWorkflowLifecycle(input: Input): RuntimeWorkflowLifecycle[] { return [{ worldId: input.activeWorldId, stages: ["created", input.status.toLowerCase().includes("review") ? "review" : "active", input.unresolvedCount > 0 ? "blocked" : "stable"], lastStablePoint: input.breadcrumbs.at(-1)?.label ?? null, workflowAgeMinutes: input.breadcrumbs[0]?.at ? mins(input.breadcrumbs[0].at, input.now) : 0 }]; }
export function deriveOperationalVolatility(interruptions: RuntimeInterruptionEvent[], transitions: RuntimeTemporalTransition[]): RuntimeOperationalVolatility { return interruptions.length > 3 || transitions.length > 8 ? "severe" : interruptions.length > 1 ? "volatile" : transitions.length > 4 ? "variable" : "steady"; }
export function deriveContinuityResilience(input: { interruptions: RuntimeInterruptionEvent[]; recoveries: RuntimeRecoveryEvent[] }): RuntimeContinuityResilience { const failures = input.recoveries.filter((r) => !r.succeeded).length; if (failures > 2) return "critical"; if (failures > 0 || input.interruptions.length > 3) return "fragile"; if (input.interruptions.length > 0) return "moderate"; return "strong"; }
export function deriveTemporalDecayState(input: { stalledMinutes: number; unresolvedInterruptions: number }): RuntimeDecayState { if (input.stalledMinutes > 180 || input.unresolvedInterruptions > 3) return "stalled"; if (input.stalledMinutes > 90 || input.unresolvedInterruptions > 1) return "degrading"; if (input.stalledMinutes > 30) return "aging"; return "stable"; }

export function buildRuntimeTemporalMemory(input: Input): RuntimeTemporalMemory {
  const transitions = deriveTemporalTransitions(input);
  const events = deriveTemporalEvents(input);
  const interruptions = deriveInterruptionEvents(events, input.now);
  const recoveries = deriveRecoveryEvents(input, interruptions);
  const lifecycle = deriveWorkflowLifecycle(input);
  const epochs = deriveOperationalEpochs(events, input.activeWorldId);
  const startedAt = events[0]?.at ?? null;
  const stalledMinutes = interruptions.length > 0 ? interruptions[0].durationMinutes : 0;
  const window: RuntimeTemporalWindow = { startedAt, endedAt: input.now, ageMinutes: startedAt ? mins(startedAt, input.now) : 0, stalledMinutes, eventCount: events.length };
  const volatility = deriveOperationalVolatility(interruptions, transitions);
  const resilience = deriveContinuityResilience({ interruptions, recoveries });
  const decayState = deriveTemporalDecayState({ stalledMinutes: window.stalledMinutes, unresolvedInterruptions: interruptions.filter((x) => x.unresolved).length });
  const snapshots: RuntimeTemporalSnapshot[] = [{ at: input.now, worldId: input.activeWorldId, flowHealth: input.orchestration?.flowHealth ?? "healthy", pressure: input.orchestration?.operationalPressure ?? "low", unresolvedCount: input.unresolvedCount }];
  const checkpoints: RuntimeTemporalCheckpoint[] = [{ id: `checkpoint-${input.activeWorldId}`, at: input.now, worldId: input.activeWorldId, label: lifecycle[0]?.lastStablePoint ?? "Current stable point", stable: resilience === "strong" || resilience === "moderate" }];
  const sequences: RuntimeTemporalSequence[] = [{ worldId: input.activeWorldId, events: events.filter((e) => e.worldId === input.activeWorldId), firstAt: startedAt, lastAt: input.now, unresolvedInterruptions: interruptions.length }];
  return { events, sequences, window, epochs, interruptions, recoveries, lifecycle, transitions, snapshots, checkpoints, volatility, resilience, decayState };
}
