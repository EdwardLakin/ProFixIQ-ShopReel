import type { RuntimeChamberAction } from "@/features/shopreel/ui/system/runtimeChamberInteraction";
import type { RuntimeTopologyField } from "@/features/shopreel/ui/system/runtimeTopologyField";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export type RuntimeActionEmergencePriority = "primary" | "secondary" | "tertiary";
export type RuntimeSpatialActionAnchor = "foreground" | "midground" | "operator" | "peripheral";
export type RuntimePressureSensitiveAffordance = { pressureWeight: number; contrastWeight: number; recessionWeight: number };
export type RuntimeFocusWeightedAction = {
  action: RuntimeChamberAction;
  priority: RuntimeActionEmergencePriority;
  anchor: RuntimeSpatialActionAnchor;
  focusWeight: number;
  affordance: RuntimePressureSensitiveAffordance;
};
export type RuntimeManualEscapeAction = { label: string; href: string; priority: "tertiary"; alwaysVisible: true };
export type RuntimeEmergentActionSurface = { focal: RuntimeFocusWeightedAction[]; support: RuntimeFocusWeightedAction[]; recessed: RuntimeFocusWeightedAction[]; manualEscape: RuntimeManualEscapeAction | null };
export type RuntimeInteractionTopology = { surfaces: RuntimeEmergentActionSurface; summary: string };

export function deriveRuntimeInteractionTopology(input: { actions: RuntimeChamberAction[]; topologyField: RuntimeTopologyField; continuityPressure: number }): RuntimeInteractionTopology {
  const focalPlane = input.topologyField.gravityWell.focalPlane;
  const focal: RuntimeFocusWeightedAction[] = [];
  const support: RuntimeFocusWeightedAction[] = [];
  const recessed: RuntimeFocusWeightedAction[] = [];
  let manualEscape: RuntimeManualEscapeAction | null = null;

  input.actions.forEach((action) => {
    if (action.type === "escape_manual_route_action") {
      manualEscape = { label: action.label, href: action.href, priority: "tertiary", alwaysVisible: true };
      return;
    }
    const focusWeight = clamp(
      (action.emphasis === "primary" ? 0.7 : action.emphasis === "secondary" ? 0.5 : 0.3) * 0.6 +
        input.topologyField.gravityWell.intensity * 0.25 +
        (1 - input.continuityPressure) * 0.15,
    );
    const entry: RuntimeFocusWeightedAction = {
      action,
      priority: action.emphasis,
      anchor: action.region === "focal" ? focalPlane : action.region === "support" ? "midground" : "peripheral",
      focusWeight,
      affordance: {
        pressureWeight: clamp(input.continuityPressure * 0.7 + (1 - focusWeight) * 0.3),
        contrastWeight: clamp(focusWeight * 0.8 + input.topologyField.continuityCorridor.strength * 0.2),
        recessionWeight: clamp(action.region === "recessed" ? 0.8 : 0.35),
      },
    };

    if (action.region === "focal") focal.push(entry);
    else if (action.region === "support") support.push(entry);
    else recessed.push(entry);
  });

  return {
    surfaces: { focal, support, recessed, manualEscape },
    summary: `Focal ${focal.length}, support ${support.length}, recessed ${recessed.length}; focus plane ${focalPlane}`,
  };
}
