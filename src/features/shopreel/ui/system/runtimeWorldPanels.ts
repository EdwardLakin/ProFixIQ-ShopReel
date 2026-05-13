import type { RuntimeWorldLayoutZone } from "@/features/shopreel/ui/system/runtimeWorldLayout";

export const RUNTIME_WORLD_PANEL_TYPES = ["manual_route", "guided_flow", "operator_actions", "timeline", "metrics", "blockers", "review_queue", "continuity", "workspace", "tools"] as const;
export type RuntimeWorldPanelType = (typeof RUNTIME_WORLD_PANEL_TYPES)[number];

export type RuntimeWorldPanel = {
  id: string;
  title: string;
  type: RuntimeWorldPanelType;
  zone: RuntimeWorldLayoutZone;
  route: string;
  collapsible: boolean;
  persistent: boolean;
  contextual: boolean;
};
