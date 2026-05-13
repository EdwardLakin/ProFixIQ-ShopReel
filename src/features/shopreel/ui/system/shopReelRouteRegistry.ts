export type ShopReelRouteLifecycleStatus =
  | "production_ready"
  | "usable_but_partial"
  | "placeholder"
  | "deprecated"
  | "hidden_dev_only";

export type ShopReelRouteDefinition = {
  path: string;
  label: string;
  purpose: string;
  lifecycleStatus: ShopReelRouteLifecycleStatus;
  manualNavVisible: boolean;
  promptIntents: string[];
  requiredParams?: string[];
  nextAction?: string;
};

export const SHOPREEL_ROUTE_REGISTRY: ShopReelRouteDefinition[] = [
  { path: "/shopreel", label: "Command", purpose: "Intent-first command surface and operational home", lifecycleStatus: "production_ready", manualNavVisible: true, promptIntents: ["home", "dashboard", "continue work"], nextAction: "/shopreel/campaigns/new" },
  { path: "/shopreel/create", label: "Create", purpose: "Start new content briefs and content generation setup", lifecycleStatus: "production_ready", manualNavVisible: false, promptIntents: ["create", "new", "new campaign", "create campaign", "start campaign"], nextAction: "/shopreel/campaigns/new" },
  { path: "/shopreel/campaigns", label: "Campaigns", purpose: "Campaign list and campaign management", lifecycleStatus: "production_ready", manualNavVisible: true, promptIntents: ["campaigns", "monitor campaign", "edit campaign"], nextAction: "/shopreel/campaigns/new" },
  { path: "/shopreel/campaigns/new", label: "New campaign", purpose: "Create new campaign", lifecycleStatus: "production_ready", manualNavVisible: false, promptIntents: ["create campaign", "new campaign"], nextAction: "/shopreel/campaigns" },
  { path: "/shopreel/ideas", label: "Ideas", purpose: "Campaign ideas and opportunities", lifecycleStatus: "usable_but_partial", manualNavVisible: false, promptIntents: ["ideas", "campaign ideas", "opportunities"], nextAction: "/shopreel/opportunities" },
  { path: "/shopreel/opportunities", label: "Opportunities", purpose: "Opportunity inventory and conversion to campaigns", lifecycleStatus: "usable_but_partial", manualNavVisible: false, promptIntents: ["opportunity", "opportunities"], nextAction: "/shopreel/campaigns/new" },
  { path: "/shopreel/upload", label: "Manual upload", purpose: "Manual media upload flow", lifecycleStatus: "production_ready", manualNavVisible: false, promptIntents: ["upload", "manual upload", "upload video"], nextAction: "/shopreel/library" },
  { path: "/shopreel/video-creation", label: "Video creation", purpose: "Video creation flow", lifecycleStatus: "usable_but_partial", manualNavVisible: false, promptIntents: ["create video", "video creation", "video from idea"], nextAction: "/shopreel/render-queue" },
  { path: "/shopreel/render-queue", label: "Render queue", purpose: "Render monitoring and recovery", lifecycleStatus: "production_ready", manualNavVisible: false, promptIntents: ["render", "render video", "render queue"], nextAction: "/shopreel/exports" },
  { path: "/shopreel/exports", label: "Exports", purpose: "Export packages and download readiness", lifecycleStatus: "production_ready", manualNavVisible: false, promptIntents: ["export", "download", "finished video"], nextAction: "/shopreel/publish-center" },
  { path: "/shopreel/library", label: "Library", purpose: "Media and output library", lifecycleStatus: "production_ready", manualNavVisible: true, promptIntents: ["library", "assets", "downloads"], nextAction: "/shopreel/editor" },
  { path: "/shopreel/publish-center", label: "Publish center", purpose: "Publish preparation and readiness", lifecycleStatus: "usable_but_partial", manualNavVisible: false, promptIntents: ["publish", "publish to instagram", "publish prep"], nextAction: "/shopreel/publish-queue" },
  { path: "/shopreel/publish-queue", label: "Publish queue", purpose: "Publishing queue and queue status", lifecycleStatus: "usable_but_partial", manualNavVisible: false, promptIntents: ["publish queue", "queue"], nextAction: "/shopreel/published" },
  { path: "/shopreel/editor", label: "Editor", purpose: "Edit generated content and campaigns", lifecycleStatus: "usable_but_partial", manualNavVisible: false, promptIntents: ["edit", "editor", "edit campaign"], nextAction: "/shopreel/review" },
  { path: "/shopreel/review", label: "Review", purpose: "Review and continuity/resume surface", lifecycleStatus: "usable_but_partial", manualNavVisible: true, promptIntents: ["resume", "continue", "review"], nextAction: "/shopreel/campaigns" },
  { path: "/shopreel/settings", label: "Settings", purpose: "Workspace, billing, auth and configuration controls", lifecycleStatus: "production_ready", manualNavVisible: true, promptIntents: ["settings", "billing", "workspace settings"], nextAction: "/shopreel/settings" },
  { path: "/shopreel/settings/developer/growth-agent", label: "Developer growth agent", purpose: "Developer-only experiments", lifecycleStatus: "hidden_dev_only", manualNavVisible: false, promptIntents: ["dev", "developer"], nextAction: "/shopreel/settings" },
];

export function getManualNavRoutes() {
  return SHOPREEL_ROUTE_REGISTRY.filter((route) => route.manualNavVisible && route.lifecycleStatus !== "deprecated" && route.lifecycleStatus !== "hidden_dev_only");
}

export type RouteDecision = {
  intent: string;
  route: string;
  reason: string;
  usedRecovery: boolean;
  ignoredStaleContinuity: boolean;
};

export function resolveRouteFromPrompt(prompt: string, lastRoute?: string): RouteDecision {
  const q = prompt.toLowerCase();
  const isResume = /\b(resume|continue|recover|restore)\b/.test(q);
  const explicitCreate = /\b(create|new|start|build|refine)\b/.test(q);
  const explicitCampaign = /\bcampaign\b/.test(q);

  if (/\b(idea|ideas|opportunities|opportunity|brainstorm|trending|trend|hooks|angles)\b/.test(q)) return { intent: "ideas", route: "/shopreel/ideas", reason: "Ideas/opportunities intent routed to canonical ideas surface", usedRecovery: false, ignoredStaleContinuity: true };
  if (/\b(upload|manual upload|upload video|asset|assets|library)\b/.test(q)) return { intent: "upload", route: "/shopreel/upload", reason: "Upload/assets intent", usedRecovery: false, ignoredStaleContinuity: true };
  if (/\b(generate|script|scripts|hook|hooks|studio|storyboard)\b/.test(q)) return { intent: "generation", route: "/shopreel/create", reason: "Generation/script intent", usedRecovery: false, ignoredStaleContinuity: true };
  if (/\b(render|render this video|render queue)\b/.test(q)) return { intent: "render", route: "/shopreel/render-queue", reason: "Render queue intent", usedRecovery: false, ignoredStaleContinuity: true };
  if (/\b(review|approval|approvals|approve)\b/.test(q)) return { intent: "review", route: "/shopreel/review", reason: "Review/approvals intent", usedRecovery: false, ignoredStaleContinuity: true };
  if (/\b(calendar|schedule|scheduling|publish|instagram|tiktok publish|publish queue)\b/.test(q)) return { intent: "publish", route: "/shopreel/publish-center", reason: "Calendar/publishing intent", usedRecovery: false, ignoredStaleContinuity: true };
  if (/\b(analytics|performance|report|reports)\b/.test(q)) return { intent: "analytics", route: "/shopreel/analytics", reason: "Analytics/reporting intent", usedRecovery: false, ignoredStaleContinuity: true };
  if (/\b(download|finished video|export)\b/.test(q)) return { intent: "export", route: "/shopreel/exports", reason: "Export intent", usedRecovery: false, ignoredStaleContinuity: true };
  if (/\b(create a video|video from this idea|video creation)\b/.test(q)) return { intent: "video_creation", route: "/shopreel/video-creation", reason: "Video creation intent", usedRecovery: false, ignoredStaleContinuity: true };
  if (explicitCreate && explicitCampaign) return { intent: "create_campaign", route: "/shopreel/campaigns/new", reason: "Campaign creation/refinement intent", usedRecovery: false, ignoredStaleContinuity: true };
  if (/\b(edit|revise|update|refine)\b/.test(q) && explicitCampaign) return { intent: "edit_campaign", route: "/shopreel/campaigns", reason: "Campaign maintenance intent", usedRecovery: false, ignoredStaleContinuity: true };
  if (isResume) return { intent: "resume", route: lastRoute || "/shopreel/review", reason: "Resume/continue requested; recovery route allowed", usedRecovery: true, ignoredStaleContinuity: false };
  return { intent: "default", route: "/shopreel", reason: "No explicit intent; route to home", usedRecovery: false, ignoredStaleContinuity: false };
}
