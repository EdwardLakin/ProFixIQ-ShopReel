import type { RuntimeWorldAction } from "@/features/shopreel/ui/system/runtimeWorldEntry";

export type RuntimeOperatorPresence = "embedded" | "stabilizing";
export type RuntimeOperatorGuidanceState = "guided" | "urgent" | "steady";
export type RuntimeOperatorContinuity = { rememberedAction: string | null; familiarity: number };
export type RuntimeOperatorRecovery = { recovering: boolean; pressure: number };
export type RuntimeOperatorAttentionBias = "focal" | "support";

export type RuntimeChamberActionType = "focal_action" | "supporting_action" | "background_action" | "operator_guided_action" | "escape_manual_route_action" | "blocked_action" | "recovery_action";
export type RuntimeChamberAction = { type: RuntimeChamberActionType; label: string; href: string; emphasis: "primary" | "secondary" | "tertiary"; region: "focal" | "support" | "recessed"; topologyWeight?: number };

export function deriveRuntimeChamberActions(params: { primaryAction: RuntimeWorldAction | null; secondaryActions: RuntimeWorldAction[]; manualHref: string; blocked: boolean; continuityPressure?: number; }): RuntimeChamberAction[] {
  const actions: RuntimeChamberAction[] = [];
  if (params.primaryAction) actions.push({ type: params.blocked ? "recovery_action" : "focal_action", label: params.primaryAction.label, href: params.primaryAction.href, emphasis: "primary", region: "focal", topologyWeight: 1 });
  actions.push(...params.secondaryActions.slice(0, 3).map((action, index): RuntimeChamberAction => ({ type: index === 0 ? "supporting_action" : "background_action", label: action.label, href: action.href, emphasis: "secondary", region: index === 0 ? "support" : "recessed", topologyWeight: index === 0 ? 0.7 : 0.45 })));
  actions.push({ type: "escape_manual_route_action", label: (params.continuityPressure ?? 0) > 0.65 ? "Stabilize route" : "Manual route", href: params.manualHref, emphasis: "tertiary", region: "recessed", topologyWeight: 0.3 });
  return actions;
}
