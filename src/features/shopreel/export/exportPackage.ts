import type { Json } from "@/types/supabase";
import type { ShopReelPlatformId } from "@/features/shopreel/platforms/presets";

export type ShopReelExportPackageStatus = "draft" | "ready" | "exported" | "posted" | "failed" | "archived" | "unknown";
export type ShopReelExportPlatformOutput = { platformId: ShopReelPlatformId; captionText: string; hashtags: string[]; checklist: string[]; postedUrl?: string; postedAt?: string };
export type ShopReelExportPackage = { id: string; generationId?: string; renderJobId?: string; contentPieceId?: string; status: ShopReelExportPackageStatus; mp4Path?: string; thumbnailPath?: string; captionText?: string; hashtags: string[]; platformOutputs: ShopReelExportPlatformOutput[]; exportedAt?: string; createdAt?: string; updatedAt?: string };

type ExportRow = { id: string; generation_id: string | null; render_job_id: string | null; content_piece_id: string | null; status: string; mp4_path: string | null; thumbnail_path: string | null; caption_text: string | null; hashtags: Json | null; platform_outputs: Json | null; exported_at: string | null; created_at: string; updated_at: string; };
const asRecord = (v: Json | null | undefined): Record<string, Json | undefined> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, Json | undefined>) : {});
const asString = (v: unknown): string | undefined => (typeof v === "string" && v.trim().length > 0 ? v : undefined);
const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : []);
export function mapExportStatus(value: string | null | undefined): ShopReelExportPackageStatus { const s = (value ?? "").toLowerCase(); return (["draft","ready","exported","posted","failed","archived"] as const).includes(s as never) ? (s as ShopReelExportPackageStatus) : "unknown"; }
export function mapExportPackage(row: ExportRow): ShopReelExportPackage {
  const platformOutputsRaw = asRecord(row.platform_outputs);
  const platformOutputs = Object.entries(platformOutputsRaw).flatMap(([platformId, payload]) => {
    if (platformId !== "instagram_reels" && platformId !== "facebook_reels" && platformId !== "tiktok" && platformId !== "youtube_shorts") return [];
    const obj = payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
    return [{ platformId, captionText: asString(obj.captionText) ?? "", hashtags: asStrings(obj.hashtags), checklist: asStrings(obj.checklist), postedUrl: asString(obj.postedUrl), postedAt: asString(obj.postedAt) }];
  }) as ShopReelExportPlatformOutput[];
  return { id: row.id, generationId: row.generation_id ?? undefined, renderJobId: row.render_job_id ?? undefined, contentPieceId: row.content_piece_id ?? undefined, status: mapExportStatus(row.status), mp4Path: row.mp4_path ?? undefined, thumbnailPath: row.thumbnail_path ?? undefined, captionText: row.caption_text ?? undefined, hashtags: asStrings(row.hashtags), platformOutputs, exportedAt: row.exported_at ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at };
}
