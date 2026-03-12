import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { discoverStorySources } from "@/features/shopreel/discovery/discoverContent";
import { generateStoryPipeline } from "@/features/shopreel/story-builder";
import { getStorySourceWithAssets } from "@/features/shopreel/story-sources/server";
import type {
  StoryGenerationMode,
  StorySource,
  StorySourceKind,
  StorySourceOrigin,
} from "@/features/shopreel/story-sources";

type GenerateBody = {
  storySourceId?: string | null;
  createRenderJobNow?: boolean;
  limit?: number | null;
};

function toObjectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function toStorySourceKind(value: string): StorySourceKind {
  switch (value) {
    case "job_completed":
    case "inspection_completed":
    case "repair_completed":
    case "before_after":
    case "project_progress":
    case "project_completed":
    case "educational_insight":
    case "expert_tip":
    case "customer_result":
    case "product_launch":
    case "service_highlight":
    case "milestone":
    case "manual_upload":
    case "daily_timeline":
      return value;
    default:
      return "manual_upload";
  }
}

function toStorySourceOrigin(value: string): StorySourceOrigin {
  switch (value) {
    case "manual_upload":
    case "project":
    case "day_timeline":
    case "imported_media":
    case "future_operational_event":
      return value;
    default:
      return "manual_upload";
  }
}

function toStoryGenerationMode(value: string): StoryGenerationMode {
  switch (value) {
    case "manual":
    case "assisted":
    case "autopilot":
      return value;
    default:
      return "manual";
  }
}

function toStorySourceAssetType(value: string) {
  switch (value) {
    case "photo":
    case "video":
    case "note":
    case "text":
    case "other":
      return value;
    default:
      return "other";
  }
}

function toStorySource(saved: NonNullable<Awaited<ReturnType<typeof getStorySourceWithAssets>>>) {
  const source: StorySource = {
    id: saved.source.id,
    shopId: saved.source.shop_id,
    title: saved.source.title,
    description: saved.source.description,
    kind: toStorySourceKind(saved.source.kind),
    origin: toStorySourceOrigin(saved.source.origin),
    generationMode: toStoryGenerationMode(saved.source.generation_mode),
    occurredAt: saved.source.occurred_at,
    startedAt: saved.source.started_at,
    endedAt: saved.source.ended_at,
    projectId: saved.source.project_id,
    projectName: saved.source.project_name,
    vehicleLabel: saved.source.vehicle_label,
    customerLabel: saved.source.customer_label,
    technicianLabel: saved.source.technician_label,
    tags: saved.source.tags ?? [],
    notes: saved.source.notes ?? [],
    facts: toObjectRecord(saved.source.facts ?? {}),
    metadata: toObjectRecord(saved.source.metadata ?? {}),
    assets: saved.assets.map((asset) => ({
      id: asset.id,
      assetType: toStorySourceAssetType(asset.asset_type),
      contentAssetId: asset.content_asset_id,
      manualAssetId: asset.manual_asset_id,
      url: asset.url,
      title: asset.title,
      caption: asset.caption,
      note: asset.note,
      takenAt: asset.taken_at,
      sortOrder: asset.sort_order,
      metadata: toObjectRecord(asset.metadata ?? {}),
    })),
    refs: saved.refs.map((ref) => ({
      type: ref.ref_type as
        | "content_asset"
        | "manual_asset"
        | "content_event"
        | "content_piece"
        | "project"
        | "day_bucket"
        | "future_work_order"
        | "future_inspection",
      id: ref.ref_id,
    })),
    createdAt: saved.source.created_at,
    updatedAt: saved.source.updated_at,
  };

  return source;
}

export async function POST(req: Request) {
  try {
    const shopId = await getCurrentShopId();
    const body = (await req.json().catch(() => ({}))) as GenerateBody;

    if (body.storySourceId) {
      const result = await getStorySourceWithAssets({
        shopId,
        storySourceId: body.storySourceId,
      });

      if (!result) {
        return NextResponse.json(
          { ok: false, error: "Story source not found" },
          { status: 404 },
        );
      }

      const storySource = toStorySource(result);

      const generated = await generateStoryPipeline({
        shopId,
        source: storySource,
        sourceSystem: "shopreel",
        createRenderJobNow: body.createRenderJobNow ?? false,
      });

      return NextResponse.json({
        ok: true,
        mode: "saved_story_source",
        generated,
      });
    }

    const discovered = await discoverStorySources(shopId);
    const limited = discovered.slice(0, body.limit ?? 1);

    const results = [];
    for (const source of limited) {
      const generated = await generateStoryPipeline({
        shopId,
        source,
        sourceSystem: "shopreel",
        createRenderJobNow: body.createRenderJobNow ?? false,
      });
      results.push(generated);
    }

    return NextResponse.json({
      ok: true,
      mode: "discover_and_generate",
      count: results.length,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate story";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
