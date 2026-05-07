import type { Json } from "@/types/supabase";
import type { PublishReadinessSnapshot } from "@/features/shopreel/publish/lifecycle";

export type UnifiedLifecycleStage =
  | "brief"
  | "storyboard"
  | "editor"
  | "render_pending"
  | "render_complete"
  | "package_draft"
  | "package_review"
  | "package_ready"
  | "exported";

export type NextBestAction = { label: string; href: string };

const asObj = (value: Json | null | undefined): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const asString = (value: unknown): string | undefined => (typeof value === "string" && value.trim().length > 0 ? value : undefined);
const asNumber = (value: unknown): number | undefined => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

export function deriveLifecycleStage(input: {
  hasStoryboard: boolean;
  hasEditor: boolean;
  renderStatus?: string | null;
  packageStatus?: string | null;
  approvalState?: string | null;
}) : UnifiedLifecycleStage {
  if (!input.hasStoryboard) return "brief";
  if (!input.hasEditor) return "storyboard";
  if (!input.renderStatus) return "editor";
  if (["queued", "processing", "rendering"].includes(input.renderStatus)) return "render_pending";
  if (input.renderStatus !== "completed" && input.renderStatus !== "ready") return "editor";
  if (!input.packageStatus) return "render_complete";
  if (input.packageStatus === "exported" || input.approvalState === "exported") return "exported";
  if (input.approvalState === "approved" || input.packageStatus === "ready") return "package_ready";
  if (input.approvalState === "needs_review") return "package_review";
  return "package_draft";
}

export function deriveReadinessBadge(readiness: PublishReadinessSnapshot | null | undefined): { label: string; tone: "good" | "warn" | "neutral" } {
  if (!readiness) return { label: "Readiness unknown", tone: "neutral" };
  if (readiness.status === "ready") return { label: "Ready", tone: "good" };
  if (readiness.status === "blocked") return { label: `Blocked (${readiness.blockerCount})`, tone: "warn" };
  return { label: `Needs review (${readiness.warningCount})`, tone: "neutral" };
}

export function deriveNextBestAction(input: {
  stage: UnifiedLifecycleStage;
  generationId?: string;
  editorPath?: string;
  packageId?: string;
  blocked: boolean;
}): NextBestAction {
  if (input.blocked) return { label: "Fix blockers", href: input.packageId ? `/shopreel/exports/${input.packageId}` : `/shopreel/generations/${input.generationId ?? ""}` };
  if (input.stage === "brief" || input.stage === "storyboard") return { label: "Continue storyboard", href: `/shopreel/generations/${input.generationId ?? ""}` };
  if (input.stage === "editor") return { label: "Open editor", href: input.editorPath ?? `/shopreel/editor/${input.generationId ?? ""}` };
  if (input.stage === "render_pending") return { label: "View render", href: "/shopreel/render-queue" };
  if (input.stage === "render_complete") return { label: "Create publish package", href: "/shopreel/exports" };
  if (input.stage === "package_draft" || input.stage === "package_review") return { label: "Review package", href: `/shopreel/exports/${input.packageId ?? ""}` };
  if (input.stage === "package_ready") return { label: "Export package", href: `/shopreel/exports/${input.packageId ?? ""}` };
  return { label: "Open package", href: `/shopreel/exports/${input.packageId ?? ""}` };
}

export function deriveLifecycleMeta(metadata: Json | null | undefined): {
  activeVariant?: string;
  sceneCount?: number;
  durationSeconds?: number;
  sourceType?: string;
  preflightScore?: number;
} {
  const obj = asObj(metadata);
  return {
    activeVariant: asString(obj.activeVariantName) ?? asString(obj.variantName),
    sceneCount: asNumber(obj.sceneCount),
    durationSeconds: asNumber(obj.duration_seconds) ?? asNumber(obj.durationSeconds),
    sourceType: asString(obj.output_type),
    preflightScore: asNumber(asObj(obj.preflight as Json).score),
  };
}
