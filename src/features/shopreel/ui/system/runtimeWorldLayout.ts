export const RUNTIME_WORLD_LAYOUT_ZONES = ["primary", "secondary", "operator", "timeline", "utility", "floating", "bottom"] as const;

export type RuntimeWorldLayoutZone = (typeof RUNTIME_WORLD_LAYOUT_ZONES)[number];

export type RuntimeWorldWorkspaceState = {
  openPanelIds: string[];
  collapsedPanelIds: string[];
  focusedPanelId: string | null;
  lastViewedSection: string | null;
  scrollY: number;
  lastManualTool: string | null;
  lastEmbeddedRoute: string | null;
  activeGuidedQuestion: string | null;
};
