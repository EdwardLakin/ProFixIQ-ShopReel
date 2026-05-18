import { SHOPREEL_ROUTE_REGISTRY } from "../src/features/shopreel/ui/system/shopReelRouteRegistry";

const hasSettings = SHOPREEL_ROUTE_REGISTRY.some((r) => r.path === "/shopreel/settings" && r.manualNavVisible);
if (!hasSettings) throw new Error("Settings route missing or not visible in manual nav registry");

const requiredUtility = ["/shopreel", "/shopreel/settings"];
for (const route of requiredUtility) {
  if (!SHOPREEL_ROUTE_REGISTRY.some((r) => r.path === route)) {
    throw new Error(`Required utility route missing: ${route}`);
  }
}

export const DASHBOARD_DECK_LAYOUT_VARIANTS = {
  sm: "stacked_vertical_rail",
  md: "side_by_side_operator_deck",
  lg: "side_by_side_operator_deck",
  xl: "side_by_side_operator_deck",
  "2xl": "side_by_side_operator_deck",
  deck_variant: "stacked_deck",
} as const;

if (
  !DASHBOARD_DECK_LAYOUT_VARIANTS.sm ||
  !DASHBOARD_DECK_LAYOUT_VARIANTS.md ||
  !DASHBOARD_DECK_LAYOUT_VARIANTS.lg ||
  !DASHBOARD_DECK_LAYOUT_VARIANTS.xl ||
  !DASHBOARD_DECK_LAYOUT_VARIANTS["2xl"]
) {
  throw new Error("Deck breakpoint config is incomplete");
}

console.log("dashboard-nav-smoke: ok");
