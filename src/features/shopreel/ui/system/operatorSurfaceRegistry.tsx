import type { ReactNode } from "react";
import type { OperatorSurfaceId } from "@/features/shopreel/ui/system/operatorRuntime";

export type OperatorSurfaceDefinition = {
  id: OperatorSurfaceId;
  label: string;
  description: string;
  placeholderStatus: "scaffold" | "ready_for_inline_migration";
  preferredTransitionMode: "inline_replace" | "inline_stack" | "overlay_focus";
  routeFallback: string;
  renderPriority: number;
  render: () => ReactNode;
};

const scaffoldCard = (title: string, body: string) => (
  <article className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-sm">
    <div className="text-xs uppercase tracking-[0.15em] text-cyan-100/70">Runtime scaffold</div>
    <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
    <p className="mt-2 text-sm text-white/75">{body}</p>
  </article>
);

export const operatorSurfaceRegistry: Record<OperatorSurfaceId, OperatorSurfaceDefinition> = {
  idle_command: { id: "idle_command", label: "Idle Command", description: "Awaiting operator intent.", placeholderStatus: "ready_for_inline_migration", preferredTransitionMode: "overlay_focus", routeFallback: "/shopreel", renderPriority: 1, render: () => scaffoldCard("Operator waiting", "Submit a command to materialize an active workflow region.") },
  campaign_planning: { id: "campaign_planning", label: "Campaign Planning Surface", description: "Plan campaign intent into structured direction.", placeholderStatus: "scaffold", preferredTransitionMode: "inline_replace", routeFallback: "/shopreel/create", renderPriority: 10, render: () => scaffoldCard("CampaignPlanningSurface", "Intent interpretation and campaign brief shaping will live here.") },
  review_inbox: { id: "review_inbox", label: "Review Inbox Surface", description: "Supervision and approval decisions.", placeholderStatus: "scaffold", preferredTransitionMode: "inline_stack", routeFallback: "/shopreel/review", renderPriority: 9, render: () => scaffoldCard("ReviewInboxSurface", "Approval queues and refinement decisions will materialize inline.") },
  campaign_workspace: { id: "campaign_workspace", label: "Campaign Workspace Surface", description: "Active campaign refinement and execution.", placeholderStatus: "scaffold", preferredTransitionMode: "inline_replace", routeFallback: "/shopreel/campaigns", renderPriority: 8, render: () => scaffoldCard("CampaignWorkspaceSurface", "Continue active campaign context with minimal route switching.") },
  asset_intake: { id: "asset_intake", label: "Asset Intake Surface", description: "Collect supporting assets and references.", placeholderStatus: "scaffold", preferredTransitionMode: "overlay_focus", routeFallback: "/shopreel/library", renderPriority: 7, render: () => scaffoldCard("AssetIntakeSurface", "Asset upload and reference alignment will be handled here.") },
  publish_package_review: { id: "publish_package_review", label: "Publish Package Surface", description: "Assemble and verify publishing package.", placeholderStatus: "scaffold", preferredTransitionMode: "inline_stack", routeFallback: "/shopreel/publish-center", renderPriority: 6, render: () => scaffoldCard("PublishPackageSurface", "Packaging checklist and readiness controls will appear here.") },
  manual_operations: { id: "manual_operations", label: "Manual Operations Surface", description: "Power user and manual recovery tools.", placeholderStatus: "scaffold", preferredTransitionMode: "overlay_focus", routeFallback: "/shopreel/operations", renderPriority: 5, render: () => scaffoldCard("ManualOperationsSurface", "Use manual tooling when the runtime is interrupted or blocked.") },
  blocked_recovery: { id: "blocked_recovery", label: "Blocked Recovery Surface", description: "Recover from missing input or blocked state.", placeholderStatus: "scaffold", preferredTransitionMode: "overlay_focus", routeFallback: "/shopreel/library", renderPriority: 4, render: () => scaffoldCard("BlockedRecoverySurface", "Runtime needs more context. Recover here before continuing.") },
  export_ready: { id: "export_ready", label: "Export Ready", description: "Ready to handoff export package.", placeholderStatus: "scaffold", preferredTransitionMode: "inline_replace", routeFallback: "/shopreel/exports", renderPriority: 3, render: () => scaffoldCard("ExportReadySurface", "Final export handoff summary will render here.") },
};

export function resolveRuntimeFallbackRoute(surfaceId: OperatorSurfaceId, overrideRoute?: string): string {
  return overrideRoute || operatorSurfaceRegistry[surfaceId].routeFallback;
}
