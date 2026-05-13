import type { RuntimeWorldAction } from "@/features/shopreel/ui/system/runtimeWorldEntry";

export type RuntimeChamberActionType = "focal_action" | "supporting_action" | "background_action" | "operator_guided_action" | "escape_manual_route_action" | "blocked_action" | "recovery_action";
export type RuntimeChamberAction = { type: RuntimeChamberActionType; label: string; href: string; emphasis: "primary" | "secondary" | "tertiary" };

export function deriveRuntimeChamberActions(params: {
  primaryAction: RuntimeWorldAction | null;
  secondaryActions: RuntimeWorldAction[];
  manualHref: string;
  blocked: boolean;
}): RuntimeChamberAction[] {
  const actions: RuntimeChamberAction[] = [];
  if (params.primaryAction) {
    actions.push({ type: params.blocked ? "recovery_action" : "focal_action", label: params.primaryAction.label, href: params.primaryAction.href, emphasis: "primary" });
  }
  actions.push(...params.secondaryActions.slice(0, 3).map((action, index): RuntimeChamberAction => ({ type: index === 0 ? "supporting_action" : "background_action", label: action.label, href: action.href, emphasis: "secondary" })));
  actions.push({ type: "escape_manual_route_action", label: "Manual route", href: params.manualHref, emphasis: "tertiary" });
  return actions;
}
