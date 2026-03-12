import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { generateStoryPipeline } from "@/features/shopreel/story-builder";
import type {
  StoryGenerationMode,
  StorySource,
  StorySourceKind,
  StorySourceOrigin,
} from "@/features/shopreel/story-sources";

function toObjectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
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

type Body = {
  createRenderJobNow?: boolean;
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Body;

    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { data: opportunity, error: opportunityError } = await legacy
      .from("shopreel_content_opportunities")
      .select("id, story_source_id, score, status, reason, metadata")
      .eq("id", id)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (opportunityError) {
      throw new Error(opportunityError.message);
    }

    if (!opportunity) {
      return NextResponse.json(
        { ok: false, error: "Opportunity not found" },
        { status: 404 },
      );
    }

    const { data: source, error: sourceError } = await legacy
      .from("shopreel_story_sources")
      .select("*")
      .eq("id", opportunity.story_source_id)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (sourceError) {
      throw new Error(sourceError.message);
    }

    if (!source) {
      return NextResponse.json(
        { ok: false, error: "Story source not found" },
        { status: 404 },
      );
    }

    const [{ data: assets, error: assetsError }, { data: refs, error: refsError }] =
      await Promise.all([
        legacy
          .from("shopreel_story_source_assets")
          .select("*")
          .eq("shop_id", shopId)
          .eq("story_source_id", source.id)
          .order("sort_order", { ascending: true }),
        legacy
          .from("shopreel_story_source_refs")
          .select("*")
          .eq("shop_id", shopId)
          .eq("story_source_id", source.id)
          .order("created_at", { ascending: true }),
      ]);

    if (assetsError) {
      throw new Error(assetsError.message);
    }

    if (refsError) {
      throw new Error(refsError.message);
    }

    const storySource: StorySource = {
      id: source.id,
      shopId: source.shop_id,
      title: source.title,
      description: source.description,
      kind: toStorySourceKind(source.kind),
      origin: toStorySourceOrigin(source.origin),
      generationMode: toStoryGenerationMode(source.generation_mode),
      occurredAt: source.occurred_at,
      startedAt: source.started_at,
      endedAt: source.ended_at,
      projectId: source.project_id,
      projectName: source.project_name,
      vehicleLabel: source.vehicle_label,
      customerLabel: source.customer_label,
      technicianLabel: source.technician_label,
      tags: source.tags ?? [],
      notes: source.notes ?? [],
      facts: toObjectRecord(source.facts ?? {}),
      metadata: toObjectRecord(source.metadata ?? {}),
      assets: (assets ?? []).map((asset: any) => ({
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
      refs: (refs ?? []).map((ref: any) => ({
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
      createdAt: source.created_at,
      updatedAt: source.updated_at,
    };

    const generated = await generateStoryPipeline({
      shopId,
      source: storySource,
      sourceSystem: "shopreel",
      createRenderJobNow: body.createRenderJobNow ?? true,
    });

    await legacy
      .from("shopreel_content_opportunities")
      .update({
        status: "generated",
        metadata: {
          ...(toObjectRecord(opportunity.metadata ?? {})),
          last_generation_id: generated.generation.id,
          last_content_piece_id: generated.contentPiece.id,
          last_render_job_id: generated.renderJob?.id ?? null,
          generated_at: new Date().toISOString(),
        },
      })
      .eq("id", id);

    return NextResponse.json({
      ok: true,
      generated: {
        opportunityId: id,
        contentPieceId: generated.contentPiece.id,
        renderJobId: generated.renderJob?.id ?? null,
        generationId: generated.generation.id,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate from opportunity";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
