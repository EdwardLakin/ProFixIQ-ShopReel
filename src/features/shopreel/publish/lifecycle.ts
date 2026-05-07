import type { Json } from "@/types/supabase";
import type { ShopReelPlatformId } from "@/features/shopreel/platforms/presets";

export type PublishLifecycleStage = "brief" | "storyboard" | "editor" | "render" | "review" | "publish_package";
export type PublishChecklistKey = "video_output" | "thumbnail" | "caption" | "title" | "description" | "hashtags" | "platform_selected" | "duration_fit" | "aspect_ratio_fit" | "cta" | "brand_checks";
export type PublishReadinessState = "ready" | "needs_review" | "blocked";
export type ApprovalCheckpointState = "draft" | "needs_review" | "approved" | "exported";

export type PublishTarget = { platformId: ShopReelPlatformId; label: string };
export type PublishAsset = { type: "video" | "thumbnail"; url?: string; available: boolean };
export type PublishChecklistItem = { key: PublishChecklistKey; label: string; passed: boolean; reason?: string };
export type PublishReadinessSnapshot = { status: PublishReadinessState; score?: number; blockerCount: number; warningCount: number; checkedAt?: string; checklist: PublishChecklistItem[] };
export type ExportBundle = { videoFileUrl?: string; thumbnailUrl?: string; captionText?: string; title?: string; description?: string; hashtags: string[]; platformTarget?: ShopReelPlatformId; generatedAt?: string };
export type ApprovalCheckpoint = { state: ApprovalCheckpointState; reviewedAt?: string; reviewedBy?: string; note?: string };
export type PublishPackage = {
  id: string;
  sourceEditorSessionId?: string;
  sourceRenderJobId?: string;
  variantId?: string;
  variantName?: string;
  sceneCount?: number;
  durationSeconds?: number;
  aspectRatio?: string;
  captionText?: string;
  title?: string;
  description?: string;
  hashtags: string[];
  cta?: string;
  targets: PublishTarget[];
  assets: PublishAsset[];
  readiness: PublishReadinessSnapshot;
  approval: ApprovalCheckpoint;
  exportBundle: ExportBundle;
  createdAt?: string;
  updatedAt?: string;
};

const asObj = (value: Json | null | undefined): Record<string, Json | undefined> => value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, Json | undefined>) : {};
const asString = (value: unknown): string | undefined => typeof value === "string" && value.trim().length > 0 ? value : undefined;
const asNumber = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : undefined;
const asStrings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

export type LifecycleCardMeta = {
  readiness?: PublishReadinessSnapshot;
  variantName?: string;
  sceneCount?: number;
  durationSeconds?: number;
  source: PublishLifecycleStage;
};

export function computePublishReadiness(input: {
  videoUrl?: string;
  thumbnailUrl?: string;
  captionText?: string;
  title?: string;
  description?: string;
  hashtags: string[];
  targets: PublishTarget[];
  durationSeconds?: number;
  aspectRatio?: string;
  cta?: string;
  hasBrandProfile?: boolean;
  preflightScore?: number;
  preflightBlockers?: number;
  preflightWarnings?: number;
}): PublishReadinessSnapshot {
  const checks: PublishChecklistItem[] = [
    { key: "video_output", label: "Video output exists", passed: Boolean(input.videoUrl) },
    { key: "thumbnail", label: "Thumbnail exists", passed: Boolean(input.thumbnailUrl) },
    { key: "caption", label: "Caption exists", passed: Boolean(input.captionText) },
    { key: "title", label: "Title exists", passed: Boolean(input.title) },
    { key: "description", label: "Description exists", passed: Boolean(input.description) },
    { key: "hashtags", label: "Hashtags exist", passed: input.hashtags.length > 0 },
    { key: "platform_selected", label: "Platform selected", passed: input.targets.length > 0 },
    { key: "duration_fit", label: "Duration fits platform", passed: typeof input.durationSeconds !== "number" || input.durationSeconds <= 90 },
    { key: "aspect_ratio_fit", label: "Aspect ratio fits platform", passed: !input.aspectRatio || ["9:16", "1:1", "16:9"].includes(input.aspectRatio) },
    { key: "cta", label: "CTA present", passed: Boolean(input.cta) },
    { key: "brand_checks", label: "Brand checks available", passed: !input.hasBrandProfile || input.hasBrandProfile },
  ];
  const blockerCount = checks.filter((item) => !item.passed && ["video_output", "platform_selected"].includes(item.key)).length + (input.preflightBlockers ?? 0);
  const warningCount = checks.filter((item) => !item.passed).length - blockerCount + (input.preflightWarnings ?? 0);
  const status: PublishReadinessState = blockerCount > 0 ? "blocked" : warningCount > 0 ? "needs_review" : "ready";
  return { status, score: input.preflightScore, blockerCount, warningCount, checkedAt: new Date().toISOString(), checklist: checks };
}

export function deriveLifecycleMeta(generationMetadata: Json | null | undefined): LifecycleCardMeta {
  const metadata = asObj(generationMetadata);
  const preflight = asObj(metadata.preflight as Json);
  const blockerCount = Array.isArray(preflight.blockers) ? preflight.blockers.length : 0;
  const warningCount = Array.isArray(preflight.warnings) ? preflight.warnings.length : 0;
  const readiness = preflight.status ? {
    status: preflight.status === "blocked" ? "blocked" : blockerCount > 0 ? "blocked" : warningCount > 0 ? "needs_review" : "ready",
    score: asNumber(preflight.score), blockerCount, warningCount, checkedAt: asString(preflight.checkedAt), checklist: [] } as PublishReadinessSnapshot : undefined;
  return {
    readiness,
    variantName: asString(metadata.activeVariantName) ?? asString(metadata.variantName),
    sceneCount: asNumber(metadata.sceneCount),
    durationSeconds: asNumber(metadata.duration_seconds) ?? asNumber(metadata.durationSeconds),
    source: asString(metadata.publishSource) as PublishLifecycleStage ?? "storyboard",
  };
}
