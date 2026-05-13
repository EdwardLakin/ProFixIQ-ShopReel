import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import type { RuntimeWorldPanel } from "@/features/shopreel/ui/system/runtimeWorldPanels";

export type RuntimeWorldComposition = {
  worldId: RuntimeWorldId;
  panels: RuntimeWorldPanel[];
};

const panel = (id: string, title: string, type: RuntimeWorldPanel["type"], zone: RuntimeWorldPanel["zone"], route: string, collapsible = true, persistent = true, contextual = false): RuntimeWorldPanel => ({
  id,
  title,
  type,
  zone,
  route,
  collapsible,
  persistent,
  contextual,
});

export const RUNTIME_WORLD_COMPOSITIONS: Partial<Record<RuntimeWorldId, RuntimeWorldComposition>> = {
  campaign: { worldId: "campaign", panels: [panel("campaign-workspace", "Campaign Workspace", "workspace", "primary", "/shopreel/campaigns"), panel("generation-review", "Generation & Review", "review_queue", "secondary", "/shopreel/review", true, true, true), panel("guided-flow", "Guided Flow", "guided_flow", "operator", "/shopreel/operator"), panel("continuity", "Continuity", "continuity", "bottom", "/shopreel") ] },
  review: { worldId: "review", panels: [panel("approval-queue", "Approval Queue", "review_queue", "primary", "/shopreel/review"), panel("campaign-context", "Campaign Context", "manual_route", "secondary", "/shopreel/campaigns", true, true, true), panel("decisions", "Decisions", "operator_actions", "operator", "/shopreel/operator"), panel("unresolved", "Unresolved Timeline", "timeline", "bottom", "/shopreel/render-queue") ] },
  generation: { worldId: "generation", panels: [panel("draft-outputs", "Draft Outputs", "workspace", "primary", "/shopreel/generations"), panel("assets-library", "Asset Library", "tools", "secondary", "/shopreel/library"), panel("next-step", "Refinement", "guided_flow", "operator", "/shopreel/operator"), panel("continuity", "Continuity", "continuity", "bottom", "/shopreel") ] },
  operations: { worldId: "operations", panels: [panel("operational-health", "Operational Health", "metrics", "primary", "/shopreel/operations"), panel("blockers", "Blockers", "blockers", "secondary", "/shopreel/render-queue"), panel("recovery", "Recovery Actions", "operator_actions", "operator", "/shopreel/operator"), panel("runtime-history", "Runtime History", "timeline", "bottom", "/shopreel/operations") ] },
  analytics: { worldId: "analytics", panels: [panel("signals", "Signals & Performance", "metrics", "primary", "/shopreel/analytics"), panel("campaigns", "Campaigns", "manual_route", "secondary", "/shopreel/campaigns"), panel("recommendations", "Next Cycle", "operator_actions", "operator", "/shopreel/operator"), panel("continuity", "Continuity", "continuity", "bottom", "/shopreel") ] },
};
