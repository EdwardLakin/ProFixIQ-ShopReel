import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeWorldTransitionMode =
  | "deck_to_world"
  | "world_to_world"
  | "world_to_manual_panel"
  | "manual_panel_to_world"
  | "world_to_deck"
  | "resume_world"
  | "recover_world";

export type RuntimeWorldTransitionIntent = {
  mode: RuntimeWorldTransitionMode;
  fromWorldId: RuntimeWorldId | null;
  toWorldId: RuntimeWorldId;
  fromRoute: string | null;
  toRoute: string;
  label: string;
  at: string;
};

export type RuntimeWorldTransitionSnapshot = {
  mode: RuntimeWorldTransitionMode;
  worldId: RuntimeWorldId;
  route: string;
  previousWorldId: RuntimeWorldId | null;
  previousRoute: string | null;
  reducedMotion: boolean;
};

export function createWorldEntryTransition(intent: RuntimeWorldTransitionIntent, reducedMotion: boolean): RuntimeWorldTransitionSnapshot {
  return { mode: intent.mode, worldId: intent.toWorldId, route: intent.toRoute, previousWorldId: intent.fromWorldId, previousRoute: intent.fromRoute, reducedMotion };
}

export function createWorldExitTransition(intent: RuntimeWorldTransitionIntent, reducedMotion: boolean): RuntimeWorldTransitionSnapshot {
  return { mode: intent.mode, worldId: intent.fromWorldId ?? intent.toWorldId, route: intent.fromRoute ?? intent.toRoute, previousWorldId: intent.fromWorldId, previousRoute: intent.fromRoute, reducedMotion };
}

export function deriveWorldTransitionCopy(snapshot: RuntimeWorldTransitionSnapshot): string {
  if (snapshot.mode === "deck_to_world") return "Entered world from deck.";
  if (snapshot.mode === "world_to_deck") return "Returned to deck.";
  if (snapshot.mode === "resume_world") return "Resumed active world continuity.";
  if (snapshot.mode === "recover_world") return "Recovered world continuity context.";
  return "Updated world continuity context.";
}

export function deriveWorldTransitionClasses(snapshot: RuntimeWorldTransitionSnapshot): { container: string; accent: string } {
  if (snapshot.reducedMotion) return { container: "transition-none", accent: "opacity-100" };
  return {
    container: snapshot.mode === "deck_to_world" ? "transition-all duration-300 ease-out" : "transition-all duration-200 ease-out",
    accent: snapshot.mode === "world_to_world" ? "animate-pulse" : "opacity-100",
  };
}

export type RuntimeWorldTimelineEvent = {
  worldId: RuntimeWorldId;
  mode: RuntimeWorldTransitionMode;
  route: string;
  createdAt: string;
  label: string;
};

export function buildWorldTransitionTimelineEvent(snapshot: RuntimeWorldTransitionSnapshot, label: string): RuntimeWorldTimelineEvent {
  return { worldId: snapshot.worldId, mode: snapshot.mode, route: snapshot.route, createdAt: new Date().toISOString(), label };
}

export function buildWorldEntryMemoryRecord(snapshot: RuntimeWorldTransitionSnapshot): RuntimeWorldTimelineEvent {
  return buildWorldTransitionTimelineEvent(snapshot, "world_entry");
}

export function buildWorldExitMemoryRecord(snapshot: RuntimeWorldTransitionSnapshot): RuntimeWorldTimelineEvent {
  return buildWorldTransitionTimelineEvent(snapshot, "world_exit");
}

export type RuntimeWorldIdentityTransition = RuntimeWorldTransitionSnapshot;
export type RuntimeWorldFocusState = { focusedPanelId: string | null; activeGuidedQuestion: string | null };
export type RuntimeWorldAmbientState = { stabilized: boolean; visualSeed: string };
