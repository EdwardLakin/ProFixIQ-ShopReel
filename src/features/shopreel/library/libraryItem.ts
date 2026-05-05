import type { Json } from "@/types/supabase";
import type { ShopReelPlatformId } from "@/features/shopreel/platforms/presets";
import { DEFAULT_SHOPREEL_PLATFORM_IDS } from "@/features/shopreel/platforms/presets";
import { mapRenderJob, type ShopReelRenderJob } from "@/features/shopreel/render/renderJob";
import { mapExportPackage } from "@/features/shopreel/export/exportPackage";

export type ShopReelLibraryLifecycleStatus = "draft" | "reviewed" | "render_queued" | "rendering" | "render_ready" | "render_failed" | "export_ready" | "exported" | "posted" | "failed" | "archived" | "unknown";
export type ShopReelLibraryItem = { id: string; generationId?: string; contentPieceId?: string; renderJobId?: string; exportPackageId?: string; title?: string; prompt?: string; captionText?: string; hashtags: string[]; platforms: ShopReelPlatformId[]; status: ShopReelLibraryLifecycleStatus; statusLabel: string; primaryActionLabel: string; primaryActionHref: string; secondaryActionHref?: string; mp4Path?: string; thumbnailPath?: string; createdAt?: string; updatedAt?: string; exportedAt?: string; };

type GenerationRow = { id: string; content_piece_id: string | null; render_job_id: string | null; status: string | null; story_draft: Json | null; generation_metadata: Json | null; created_at: string; updated_at: string; };
type ContentPieceRow = { id: string; title: string | null; hook: string | null; caption: string | null; };

const asRecord = (v: Json | null | undefined): Record<string, Json | undefined> => v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, Json | undefined>) : {};
const asString = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : []);

function mapGenerationStatus(value: string | null | undefined): ShopReelLibraryLifecycleStatus {
  const s = (value ?? "").toLowerCase();
  if (["reviewed", "approved", "ready"].includes(s)) return "reviewed";
  if (s === "archived") return "archived";
  if (["failed", "error"].includes(s)) return "failed";
  return "draft";
}

function labelForStatus(status: ShopReelLibraryLifecycleStatus): string {
  return { draft: "Draft", reviewed: "Reviewed", render_queued: "Render queued", rendering: "Rendering", render_ready: "Render ready", render_failed: "Render failed", export_ready: "Ready to export", exported: "Exported", posted: "Posted", failed: "Failed", archived: "Archived", unknown: "Unknown" }[status];
}

function actionFor(item: Pick<ShopReelLibraryItem, "generationId" | "status" | "exportPackageId">): Pick<ShopReelLibraryItem, "primaryActionLabel" | "primaryActionHref" | "secondaryActionHref"> {
  if (item.status === "draft" || item.status === "reviewed") return { primaryActionLabel: "Review", primaryActionHref: `/shopreel/review/${item.generationId ?? ""}`, secondaryActionHref: "/shopreel/render-jobs" };
  if (["render_queued", "rendering", "render_failed", "failed"].includes(item.status)) return { primaryActionLabel: "View render jobs", primaryActionHref: "/shopreel/render-jobs", secondaryActionHref: item.generationId ? `/shopreel/review/${item.generationId}` : undefined };
  if (item.status === "render_ready") return { primaryActionLabel: "Create/open export", primaryActionHref: "/shopreel/render-jobs", secondaryActionHref: "/shopreel/exports" };
  if (["export_ready", "exported", "posted"].includes(item.status)) return { primaryActionLabel: "Open exports", primaryActionHref: item.exportPackageId ? `/shopreel/exports?packageId=${item.exportPackageId}` : "/shopreel/exports", secondaryActionHref: "/shopreel/render-jobs" };
  return { primaryActionLabel: "Open library", primaryActionHref: "/shopreel/library" };
}

export function buildShopReelLibraryItems(input: { generations: GenerationRow[]; contentPieces: ContentPieceRow[]; renderJobs: Record<string, unknown>[]; exportPackages: Record<string, unknown>[]; }): ShopReelLibraryItem[] {
  const contentById = new Map(input.contentPieces.map((c) => [c.id, c]));
  const renderById = new Map<string, ShopReelRenderJob>();
  for (const row of input.renderJobs) {
    const mapped = mapRenderJob({ row });
    if (mapped.id) renderById.set(mapped.id, mapped);
  }
  const exportByGeneration = new Map<string, ReturnType<typeof mapExportPackage>>();
  for (const row of input.exportPackages) {
    const mapped = mapExportPackage(row as never);
    if (mapped.generationId && !exportByGeneration.has(mapped.generationId)) exportByGeneration.set(mapped.generationId, mapped);
  }

  return input.generations.map((g) => {
    const draft = asRecord(g.story_draft);
    const meta = asRecord(g.generation_metadata);
    const content = g.content_piece_id ? contentById.get(g.content_piece_id) : undefined;
    const render = g.render_job_id ? renderById.get(g.render_job_id) : undefined;
    const exp = exportByGeneration.get(g.id);
    let status = mapGenerationStatus(g.status);
    if (render?.status === "queued") status = "render_queued";
    else if (render?.status === "processing") status = "rendering";
    else if (render?.status === "ready") status = "render_ready";
    else if (render?.status === "failed") status = "render_failed";
    if (exp?.status === "ready" || exp?.status === "draft") status = "export_ready";
    else if (exp?.status === "exported") status = "exported";
    else if (exp?.status === "posted") status = "posted";
    else if (exp?.status === "failed") status = "failed";
    else if (exp?.status === "archived") status = "archived";

    const platforms = asStrings(draft.platform_ids ?? meta.platform_ids).filter((x): x is ShopReelPlatformId => x === "instagram_reels" || x === "facebook_reels" || x === "tiktok" || x === "youtube_shorts");
    return {
      id: g.id,
      generationId: g.id,
      contentPieceId: g.content_piece_id ?? undefined,
      renderJobId: render?.id,
      exportPackageId: exp?.id,
      title: asString(draft.title) ?? content?.title ?? content?.hook ?? "Untitled draft",
      prompt: asString(draft.prompt),
      captionText: exp?.captionText ?? content?.caption ?? asString(draft.caption),
      hashtags: exp?.hashtags ?? asStrings(draft.hashtags),
      platforms: platforms.length > 0 ? platforms : DEFAULT_SHOPREEL_PLATFORM_IDS,
      status,
      statusLabel: labelForStatus(status),
      ...actionFor({ generationId: g.id, status, exportPackageId: exp?.id }),
      mp4Path: exp?.mp4Path ?? render?.outputVideoPath,
      thumbnailPath: exp?.thumbnailPath ?? render?.thumbnailPath,
      createdAt: g.created_at,
      updatedAt: exp?.updatedAt ?? render?.updatedAt ?? g.updated_at,
      exportedAt: exp?.exportedAt,
    } satisfies ShopReelLibraryItem;
  });
}
