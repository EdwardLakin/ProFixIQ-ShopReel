import type { GuidedFlowStepId } from "@/features/shopreel/ui/system/guidedWorldFlow";
import type { RuntimeWorldComposition } from "@/features/shopreel/ui/system/runtimeWorldComposition";
import type { RuntimeWorldPanel } from "@/features/shopreel/ui/system/runtimeWorldPanels";
import type { RuntimeWorldTransitionIntent } from "@/features/shopreel/ui/system/runtimeWorldTransition";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeWorldChoreographyMode = "idle" | "entering" | "focused" | "reviewing" | "blocked" | "recovering" | "publishing" | "analyzing" | "resolved";
export type RuntimeWorldMotionIntent = "enter_world" | "return_to_deck" | "continue_forward" | "recover_blocker" | "review_gate" | "publish_gate" | "analyze_after_publish" | "manual_override";
export type RuntimeWorldAttentionTarget = "workspace" | "review" | "blockers" | "publish" | "analytics" | "upload" | "campaign" | "continuity";

export type RuntimeWorldPanelPriority = {
  primaryPanelId: string | null;
  secondaryPanelIds: string[];
  collapsedPanelIds: string[];
  emphasizedPanelId: string | null;
  operatorRailFocusPanelId: string | null;
  bottomStripFocusPanelId: string | null;
  nextBestActionPanelId: string | null;
};

export type RuntimeWorldOperatorCue = { label: string; nextActionLabel: string | null; blocker: boolean };
export type RuntimeWorldContinuityCue = { label: string; continuationLabel: string; breadcrumbCount: number };

export type RuntimeWorldChoreography = {
  mode: RuntimeWorldChoreographyMode;
  motionIntent: RuntimeWorldMotionIntent;
  attentionTarget: RuntimeWorldAttentionTarget;
  panelPriority: RuntimeWorldPanelPriority;
  operatorCue: RuntimeWorldOperatorCue;
  continuityCue: RuntimeWorldContinuityCue;
};

type Input = {
  worldId: RuntimeWorldId;
  status: string;
  blockers: string[];
  unresolvedCount: number;
  guidedStepId: GuidedFlowStepId | null;
  previousWorldId: RuntimeWorldId | null;
  lastActionLabel: string | null;
  breadcrumbs: Array<{ worldId: RuntimeWorldId | null }>;
  composition: RuntimeWorldComposition;
  availableActions: Array<{ label: string }>;
  transitionIntent: RuntimeWorldTransitionIntent | null;
};

export function deriveWorldTransitionIntent(input: { explicit: RuntimeWorldTransitionIntent | null; worldId: RuntimeWorldId; previousWorldId: RuntimeWorldId | null; blockers: string[]; unresolvedCount: number }): RuntimeWorldMotionIntent {
  if (input.explicit?.mode === "world_to_deck") return "return_to_deck";
  if (input.explicit?.mode === "world_to_manual_panel" || input.explicit?.mode === "manual_panel_to_world") return "manual_override";
  if (input.blockers.length > 0 || input.unresolvedCount > 0) return "recover_blocker";
  if (input.worldId === "review") return "review_gate";
  if (input.worldId === "publish") return "publish_gate";
  if (input.worldId === "analytics" && input.previousWorldId === "publish") return "analyze_after_publish";
  if (!input.previousWorldId || input.explicit?.mode === "deck_to_world" || input.explicit?.mode === "resume_world") return "enter_world";
  return "continue_forward";
}

export function prioritizeRuntimePanels(input: { worldId: RuntimeWorldId; composition: RuntimeWorldComposition; status: string; blockers: string[]; unresolvedCount: number }): RuntimeWorldPanelPriority {
  const panels = input.composition.panels;
  const byType = (type: RuntimeWorldPanel["type"]) => panels.find((panel) => panel.type === type)?.id ?? null;
  const byTitle = (pattern: RegExp) => panels.find((panel) => pattern.test(panel.title))?.id ?? null;
  let primary = panels.find((panel) => panel.zone === "primary")?.id ?? null;
  let emphasized = primary;

  if (input.worldId === "review" && (/pending|approval|review/.test(input.status) || input.unresolvedCount > 0)) primary = byType("review_queue") ?? primary;
  if (input.worldId === "render" && /failed|error|blocked/.test(input.status)) primary = byType("operator_actions") ?? byType("blockers") ?? primary;
  if (input.worldId === "publish" && /ready|approved|scheduled/.test(input.status)) primary = byType("operator_actions") ?? primary;
  if (input.worldId === "upload" && /empty|missing|none|new/.test(input.status)) primary = byType("tools") ?? byType("manual_route") ?? primary;
  if (input.worldId === "analytics") primary = byType("metrics") ?? primary;
  if (input.worldId === "campaign" && /draft|planning|new/.test(input.status)) primary = byType("workspace") ?? primary;

  if (input.blockers.length > 0) emphasized = byType("blockers") ?? byType("operator_actions") ?? primary;
  else emphasized = primary;

  const secondaryPanelIds = panels.filter((panel) => panel.id !== primary && panel.zone !== "bottom").map((panel) => panel.id);
  const collapsedPanelIds = panels.filter((panel) => panel.collapsible && panel.id !== emphasized && panel.zone === "secondary").map((panel) => panel.id);

  return {
    primaryPanelId: primary,
    secondaryPanelIds,
    collapsedPanelIds,
    emphasizedPanelId: emphasized,
    operatorRailFocusPanelId: byType("operator_actions") ?? byType("guided_flow") ?? primary,
    bottomStripFocusPanelId: panels.find((panel) => panel.zone === "bottom")?.id ?? null,
    nextBestActionPanelId: byType("operator_actions") ?? byType("guided_flow") ?? byTitle(/review|publish|upload|insight/i) ?? primary,
  };
}

export function getRuntimeOperatorCue(input: { worldId: RuntimeWorldId; status: string; blockers: string[]; unresolvedCount: number; mode: RuntimeWorldChoreographyMode; nextActionLabel: string | null; previousWorldId: RuntimeWorldId | null }): RuntimeWorldOperatorCue {
  if (input.blockers.length > 0) return { label: "A blocker is active. Resolve it before proceeding.", nextActionLabel: input.nextActionLabel, blocker: true };
  if (input.worldId === "review" && input.unresolvedCount > 0) return { label: "This world is waiting on review.", nextActionLabel: input.nextActionLabel, blocker: false };
  if (input.worldId === "render" && /failed|error/.test(input.status)) return { label: "A render failed. Recovery should be handled before publishing.", nextActionLabel: input.nextActionLabel, blocker: true };
  if (input.worldId === "upload" && /empty|missing|none|new/.test(input.status)) return { label: "Assets are missing. Start in Upload World.", nextActionLabel: input.nextActionLabel, blocker: false };
  if (input.worldId === "publish" && /ready|approved/.test(input.status)) return { label: "This looks ready for publish review.", nextActionLabel: input.nextActionLabel, blocker: false };
  if (input.previousWorldId) return { label: "Continue from the last active world.", nextActionLabel: input.nextActionLabel, blocker: false };
  return { label: "No blocker detected. Next step is refinement.", nextActionLabel: input.nextActionLabel, blocker: false };
}

export function getRuntimeContinuityCue(input: { previousWorldId: RuntimeWorldId | null; breadcrumbs: Array<{ worldId: RuntimeWorldId | null }>; guidedStepId: GuidedFlowStepId | null; lastActionLabel: string | null }): RuntimeWorldContinuityCue {
  const from = input.previousWorldId ? `from ${input.previousWorldId}` : "from deck";
  const guided = input.guidedStepId ? ` · guided ${input.guidedStepId}` : "";
  const label = `Continuing ${from}${guided}`;
  return {
    label,
    continuationLabel: input.lastActionLabel ? `Resume: ${input.lastActionLabel}` : "Resume prior flow",
    breadcrumbCount: input.breadcrumbs.length,
  };
}

export function deriveWorldChoreography(input: Input): RuntimeWorldChoreography {
  const motionIntent = deriveWorldTransitionIntent({ explicit: input.transitionIntent, worldId: input.worldId, previousWorldId: input.previousWorldId, blockers: input.blockers, unresolvedCount: input.unresolvedCount });
  const blocked = input.blockers.length > 0 || /failed|blocked|error/.test(input.status);
  const mode: RuntimeWorldChoreographyMode =
    blocked ? "blocked" :
    motionIntent === "enter_world" ? "entering" :
    input.worldId === "review" ? "reviewing" :
    input.worldId === "publish" ? "publishing" :
    input.worldId === "analytics" ? "analyzing" :
    /resolved|complete|published/.test(input.status) ? "resolved" :
    motionIntent === "recover_blocker" ? "recovering" : "focused";
  const panelPriority = prioritizeRuntimePanels({ worldId: input.worldId, composition: input.composition, status: input.status.toLowerCase(), blockers: input.blockers, unresolvedCount: input.unresolvedCount });
  const attentionTarget: RuntimeWorldAttentionTarget =
    blocked ? "blockers" :
    input.worldId === "review" ? "review" :
    input.worldId === "publish" ? "publish" :
    input.worldId === "analytics" ? "analytics" :
    input.worldId === "upload" ? "upload" :
    input.worldId === "campaign" ? "campaign" : "workspace";
  const nextActionLabel = input.availableActions[0]?.label ?? null;
  return {
    mode,
    motionIntent,
    attentionTarget,
    panelPriority,
    operatorCue: getRuntimeOperatorCue({ worldId: input.worldId, status: input.status.toLowerCase(), blockers: input.blockers, unresolvedCount: input.unresolvedCount, mode, nextActionLabel, previousWorldId: input.previousWorldId }),
    continuityCue: getRuntimeContinuityCue({ previousWorldId: input.previousWorldId, breadcrumbs: input.breadcrumbs, guidedStepId: input.guidedStepId, lastActionLabel: input.lastActionLabel }),
  };
}
