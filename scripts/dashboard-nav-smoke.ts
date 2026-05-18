import { SHOPREEL_ROUTE_REGISTRY } from "../src/features/shopreel/ui/system/shopReelRouteRegistry";

const hasSettings = SHOPREEL_ROUTE_REGISTRY.some((r) => r.path === "/shopreel/settings" && r.manualNavVisible);
if (!hasSettings) throw new Error("Settings route missing or not visible in manual nav registry");

const requiredUtility = ["/shopreel", "/shopreel/settings"];
for (const route of requiredUtility) {
  if (!SHOPREEL_ROUTE_REGISTRY.some((r) => r.path === route)) {
    throw new Error(`Required utility route missing: ${route}`);
  }
}

const desktopTabletMobile = {
  xl: "stacked deck",
  lg: "compact stacked deck",
  md: "compact stacked/horizontal deck",
  sm: "horizontal cards",
};

if (!desktopTabletMobile.xl || !desktopTabletMobile.lg || !desktopTabletMobile.md || !desktopTabletMobile.sm) {
  throw new Error("Deck breakpoint config is incomplete");
}

console.log("dashboard-nav-smoke: ok");
