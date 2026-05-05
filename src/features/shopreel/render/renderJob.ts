import type { ShopReelPlatformId } from "@/features/shopreel/platforms/presets";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as UnknownRecord;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function mapPlatformIds(value: unknown): ShopReelPlatformId[] {
  return asStringArray(value).filter((item): item is ShopReelPlatformId =>
    item === "instagram_reels" ||
    item === "facebook_reels" ||
    item === "tiktok" ||
    item === "youtube_shorts"
  );
}

export type ShopReelRenderJobStatus =
  | "draft"
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "cancelled"
  | "archived"
  | "unknown";

export type ShopReelRenderJob = {
  id: string;
  generationId?: string;
  contentPieceId?: string;
  status: ShopReelRenderJobStatus;
  title?: string;
  prompt?: string;
  platformIds: ShopReelPlatformId[];
  outputVideoPath?: string;
  thumbnailPath?: string;
  failureCode?: string;
  failureMessage?: string;
  attemptCount: number;
  progressPct?: number;
  createdAt?: string;
  updatedAt?: string;
};

export function mapRenderStatus(value: unknown): ShopReelRenderJobStatus {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "draft") return "draft";
  if (normalized === "queued" || normalized === "pending") return "queued";
  if (normalized === "rendering" || normalized === "processing" || normalized === "in_progress") return "processing";
  if (normalized === "ready" || normalized === "completed" || normalized === "published") return "ready";
  if (normalized === "failed" || normalized === "error") return "failed";
  if (normalized === "cancelled" || normalized === "canceled") return "cancelled";
  if (normalized === "archived") return "archived";
  return "unknown";
}

export function mapRenderJob(input: {
  row: Record<string, unknown>;
  generationId?: string;
}): ShopReelRenderJob {
  const row = asRecord(input.row);
  const payload = asRecord(row.render_payload);
  const status = mapRenderStatus(row.status);

  return {
    id: String(row.id ?? ""),
    generationId: input.generationId,
    contentPieceId: asString(row.content_piece_id),
    status,
    title: asString(payload.title),
    prompt: asString(payload.prompt),
    platformIds: mapPlatformIds(payload.platform_ids ?? payload.platformIds),
    outputVideoPath: asString(row.render_url),
    thumbnailPath: asString(row.thumbnail_url),
    failureCode: asString(payload.failure_code),
    failureMessage: asString(row.error_message) ?? asString(payload.failure_message),
    attemptCount: typeof row.attempt_count === "number" && Number.isFinite(row.attempt_count) ? row.attempt_count : 0,
    progressPct:
      typeof payload.progress_pct === "number" && Number.isFinite(payload.progress_pct)
        ? payload.progress_pct
        : undefined,
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
  };
}
