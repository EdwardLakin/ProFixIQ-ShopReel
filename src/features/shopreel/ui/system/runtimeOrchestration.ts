import type { OperatorSurfaceId } from "@/features/shopreel/ui/system/operatorRuntime";
import { classifyCommandIntent, type CommandIntentClassification } from "@/features/shopreel/ui/system/commandIntentClassifier";
import { resolveRouteFromPrompt } from "@/features/shopreel/ui/system/shopReelRouteRegistry";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeSurfaceId =
  | "ideas"
  | "campaigns"
  | "create"
  | "storyboard"
  | "uploads"
  | "library"
  | "render_queue"
  | "publish_center"
  | "analytics"
  | "review"
  | "operations"
  | "automation"
  | "exports"
  | "video_creation";

export type RuntimeSurfaceDefinition = {
  id: RuntimeSurfaceId;
  route: string;
  runtimeIdentity: RuntimeWorldId;
  continuityRequirements: { requiresCarryover: boolean; preferFocalEntity: boolean; continuityBias: number };
  hydrationRequirements: { contract: "campaign" | "review" | "asset" | "render" | "publish" | "analytics" | "automation" | "exports" | "idea" | "video"; optional: boolean };
  runtimeDependencies: RuntimeSurfaceId[];
  transitionBehavior: { preserveShell: boolean; allowDirectRoute: boolean; recoverable: boolean };
  environmentalProfile: { pressureWeight: number; rhythmWeight: number; momentumWeight: number };
  supportedOperatorIntents: CommandIntentClassification[];
  operatorSurfaceId: OperatorSurfaceId;
};

export const runtimeSurfaceRegistry: Record<RuntimeSurfaceId, RuntimeSurfaceDefinition> = {
  ideas: { id: "ideas", route: "/shopreel/ideas", runtimeIdentity: "generation", continuityRequirements: { requiresCarryover: true, preferFocalEntity: false, continuityBias: 0.55 }, hydrationRequirements: { contract: "idea", optional: true }, runtimeDependencies: ["campaigns"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.2, rhythmWeight: 0.45, momentumWeight: 0.35 }, supportedOperatorIntents: ["create_new_content_brief"], operatorSurfaceId: "campaign_planning" },
  campaigns: { id: "campaigns", route: "/shopreel/campaigns", runtimeIdentity: "campaign", continuityRequirements: { requiresCarryover: true, preferFocalEntity: true, continuityBias: 0.8 }, hydrationRequirements: { contract: "campaign", optional: false }, runtimeDependencies: ["review", "render_queue"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.45, rhythmWeight: 0.35, momentumWeight: 0.75 }, supportedOperatorIntents: ["continue_existing_work", "operate_existing_workflow"], operatorSurfaceId: "campaign_workspace" },
  create: { id: "create", route: "/shopreel/create", runtimeIdentity: "generation", continuityRequirements: { requiresCarryover: true, preferFocalEntity: false, continuityBias: 0.7 }, hydrationRequirements: { contract: "campaign", optional: true }, runtimeDependencies: ["campaigns", "ideas"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.35, rhythmWeight: 0.55, momentumWeight: 0.6 }, supportedOperatorIntents: ["create_new_campaign_brief", "create_new_content_brief"], operatorSurfaceId: "campaign_planning" },
  storyboard: { id: "storyboard", route: "/shopreel/storyboards", runtimeIdentity: "generation", continuityRequirements: { requiresCarryover: true, preferFocalEntity: true, continuityBias: 0.7 }, hydrationRequirements: { contract: "campaign", optional: true }, runtimeDependencies: ["campaigns", "video_creation"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.35, rhythmWeight: 0.4, momentumWeight: 0.65 }, supportedOperatorIntents: ["operate_existing_workflow"], operatorSurfaceId: "campaign_workspace" },
  uploads: { id: "uploads", route: "/shopreel/upload", runtimeIdentity: "asset_library", continuityRequirements: { requiresCarryover: false, preferFocalEntity: false, continuityBias: 0.35 }, hydrationRequirements: { contract: "asset", optional: true }, runtimeDependencies: ["library"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.3, rhythmWeight: 0.5, momentumWeight: 0.4 }, supportedOperatorIntents: ["operate_existing_workflow"], operatorSurfaceId: "asset_intake" },
  library: { id: "library", route: "/shopreel/library", runtimeIdentity: "asset_library", continuityRequirements: { requiresCarryover: true, preferFocalEntity: true, continuityBias: 0.6 }, hydrationRequirements: { contract: "asset", optional: false }, runtimeDependencies: ["uploads", "campaigns"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.3, rhythmWeight: 0.45, momentumWeight: 0.5 }, supportedOperatorIntents: ["operate_existing_workflow", "continue_existing_work"], operatorSurfaceId: "asset_intake" },
  render_queue: { id: "render_queue", route: "/shopreel/render-queue", runtimeIdentity: "render", continuityRequirements: { requiresCarryover: true, preferFocalEntity: true, continuityBias: 0.75 }, hydrationRequirements: { contract: "render", optional: false }, runtimeDependencies: ["campaigns", "review"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.75, rhythmWeight: 0.3, momentumWeight: 0.7 }, supportedOperatorIntents: ["operate_existing_workflow", "continue_existing_work"], operatorSurfaceId: "campaign_workspace" },
  publish_center: { id: "publish_center", route: "/shopreel/publish-center", runtimeIdentity: "publish", continuityRequirements: { requiresCarryover: true, preferFocalEntity: true, continuityBias: 0.8 }, hydrationRequirements: { contract: "publish", optional: false }, runtimeDependencies: ["review", "exports"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.65, rhythmWeight: 0.35, momentumWeight: 0.75 }, supportedOperatorIntents: ["review_or_publish_existing_asset", "operate_existing_workflow"], operatorSurfaceId: "publish_package_review" },
  analytics: { id: "analytics", route: "/shopreel/analytics", runtimeIdentity: "analytics", continuityRequirements: { requiresCarryover: false, preferFocalEntity: false, continuityBias: 0.4 }, hydrationRequirements: { contract: "analytics", optional: true }, runtimeDependencies: ["campaigns", "publish_center"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.2, rhythmWeight: 0.25, momentumWeight: 0.35 }, supportedOperatorIntents: ["operate_existing_workflow"], operatorSurfaceId: "manual_operations" },
  review: { id: "review", route: "/shopreel/review", runtimeIdentity: "review", continuityRequirements: { requiresCarryover: true, preferFocalEntity: true, continuityBias: 0.85 }, hydrationRequirements: { contract: "review", optional: false }, runtimeDependencies: ["campaigns", "render_queue"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.7, rhythmWeight: 0.35, momentumWeight: 0.6 }, supportedOperatorIntents: ["review_or_publish_existing_asset", "continue_existing_work", "operate_existing_workflow"], operatorSurfaceId: "review_inbox" },
  operations: { id: "operations", route: "/shopreel/operations", runtimeIdentity: "operations", continuityRequirements: { requiresCarryover: true, preferFocalEntity: false, continuityBias: 0.65 }, hydrationRequirements: { contract: "automation", optional: true }, runtimeDependencies: ["review", "render_queue", "publish_center"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.8, rhythmWeight: 0.4, momentumWeight: 0.45 }, supportedOperatorIntents: ["operate_existing_workflow", "continue_existing_work"], operatorSurfaceId: "manual_operations" },
  automation: { id: "automation", route: "/shopreel/automation", runtimeIdentity: "operations", continuityRequirements: { requiresCarryover: true, preferFocalEntity: false, continuityBias: 0.6 }, hydrationRequirements: { contract: "automation", optional: true }, runtimeDependencies: ["operations", "campaigns"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.45, rhythmWeight: 0.55, momentumWeight: 0.55 }, supportedOperatorIntents: ["operate_existing_workflow"], operatorSurfaceId: "manual_operations" },
  exports: { id: "exports", route: "/shopreel/exports", runtimeIdentity: "publish", continuityRequirements: { requiresCarryover: true, preferFocalEntity: true, continuityBias: 0.7 }, hydrationRequirements: { contract: "exports", optional: false }, runtimeDependencies: ["publish_center", "review"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.45, rhythmWeight: 0.3, momentumWeight: 0.7 }, supportedOperatorIntents: ["review_or_publish_existing_asset", "operate_existing_workflow"], operatorSurfaceId: "export_ready" },
  video_creation: { id: "video_creation", route: "/shopreel/video-creation", runtimeIdentity: "generation", continuityRequirements: { requiresCarryover: true, preferFocalEntity: true, continuityBias: 0.75 }, hydrationRequirements: { contract: "video", optional: true }, runtimeDependencies: ["storyboard", "campaigns"], transitionBehavior: { preserveShell: true, allowDirectRoute: true, recoverable: true }, environmentalProfile: { pressureWeight: 0.5, rhythmWeight: 0.45, momentumWeight: 0.75 }, supportedOperatorIntents: ["create_new_content_brief", "operate_existing_workflow"], operatorSurfaceId: "campaign_workspace" },
};

export function resolveRuntimeSurfaceFromRoute(route: string): RuntimeSurfaceDefinition {
  const match = Object.values(runtimeSurfaceRegistry).find((surface) => route.startsWith(surface.route));
  return match ?? runtimeSurfaceRegistry.campaigns;
}

export function resolveRuntimeExecution(prompt: string, lastRoute?: string) {
  const intent = classifyCommandIntent(prompt);
  const routeDecision = resolveRouteFromPrompt(prompt, lastRoute);
  const byRoute = resolveRuntimeSurfaceFromRoute(routeDecision.route);
  const byIntent = Object.values(runtimeSurfaceRegistry).find((surface) => surface.supportedOperatorIntents.includes(intent.classification));
  return { intent, target: byIntent ?? byRoute, routeDecision };
}
