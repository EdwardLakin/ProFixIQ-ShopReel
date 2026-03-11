import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateVideoConcept } from "@/features/ai/server/generateVideoConcept";
import { buildAutoEditPlan } from "@/features/shopreel/editing/buildAutoEditPlan";
import { createRenderJob } from "@/features/shopreel/render/createRenderJob";

type Params = {
  params: Promise<{ id: string }>;
};

type ManualAssetRow = {
  id: string;
  shop_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  content_goal: string | null;
  note: string | null;
  asset_type: "image" | "video" | "mixed";
  status: string;
  primary_file_url: string | null;
  duration_seconds: number | null;
  created_at: string;
};

type ManualAssetFileRow = {
  id: string;
  asset_id: string;
  shop_id: string;
  bucket: string;
  storage_path: string;
  public_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  sort_order: number;
};

type ContentTemplateRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  config: Record<string, unknown> | null;
  is_active: boolean;
};

type TopPerformingType = {
  content_type: string | null;
  avg_engagement_score: number | null;
  total_views: number | null;
};

type PieceInsertShape = {
  tenant_shop_id: string;
  source_shop_id: string;
  source_system: string;
  source_media_upload_id: string | null;
  template_id: string | null;
  title: string;
  status: "draft";
  content_type:
    | "workflow_demo"
    | "repair_story"
    | "inspection_highlight"
    | "before_after"
    | "educational_tip"
    | "how_to"
    | "findings_on_vehicle";
  hook: string | null;
  caption: string | null;
  cta: string | null;
  script_text: string | null;
  voiceover_text: string | null;
  platform_targets: Array<"instagram" | "facebook" | "tiktok" | "youtube">;
  metadata: unknown;
};

function mapContentGoalToTemplateSlug(
  contentGoal: string | null | undefined,
): string {
  switch (contentGoal) {
    case "before_after":
      return "before_after";
    case "educational_tip":
      return "educational_tip";
    case "repair_story":
      return "repair_story";
    case "promotion":
      return "workflow_demo";
    case "customer_trust":
      return "inspection_highlight";
    case "team_culture":
      return "workflow_demo";
    case "seasonal_reminder":
      return "educational_tip";
    case "product_spotlight":
      return "workflow_demo";
    default:
      return "workflow_demo";
  }
}

function mapGeneratedPlatformTargets(
  targets: Array<"instagram" | "facebook" | "tiktok" | "youtube">,
): Array<"instagram" | "facebook" | "tiktok" | "youtube"> {
  return targets;
}

function buildVisualUrls(files: ManualAssetFileRow[]): string[] {
  return files
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((file) => file.public_url ?? file.storage_path)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .slice(0, 4);
}

function buildTranscript(asset: ManualAssetRow): string {
  return [asset.title, asset.description ?? "", asset.note ?? ""]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(". ");
}

function getTemplateConfigValue(
  config: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = config?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      enqueueRender?: boolean;
    };

    const enqueueRender = body.enqueueRender !== false;
    const supabase = createAdminClient();

    const { data: assetData, error: assetError } = await supabase
      .from("shopreel_manual_assets")
      .select(
        "id, shop_id, created_by, title, description, content_goal, note, asset_type, status, primary_file_url, duration_seconds, created_at",
      )
      .eq("id", id)
      .single();

    const asset = assetData as ManualAssetRow | null;

    if (assetError || !asset) {
      return NextResponse.json({ error: "Manual asset not found" }, { status: 404 });
    }

    if (asset.status !== "uploaded" && asset.status !== "ready") {
      return NextResponse.json(
        { error: "Manual asset must be uploaded before generation" },
        { status: 400 },
      );
    }

    const { data: filesData, error: filesError } = await supabase
      .from("shopreel_manual_asset_files")
      .select(
        "id, asset_id, shop_id, bucket, storage_path, public_url, file_name, mime_type, sort_order",
      )
      .eq("asset_id", asset.id)
      .order("sort_order", { ascending: true });

    const files = (filesData ?? []) as ManualAssetFileRow[];

    if (filesError || files.length === 0) {
      return NextResponse.json(
        { error: filesError?.message ?? "Manual asset files not found" },
        { status: 400 },
      );
    }

    const templateSlug = mapContentGoalToTemplateSlug(asset.content_goal);

    const { data: templateData, error: templateError } = await supabase
      .from("content_templates")
      .select("id, name, slug, description, config, is_active")
      .eq("tenant_shop_id", asset.shop_id)
      .eq("slug", templateSlug)
      .eq("is_active", true)
      .maybeSingle();

    const template = templateData as ContentTemplateRow | null;

    if (templateError || !template) {
      return NextResponse.json(
        {
          error: `No active content template found for ${templateSlug}`,
          details: templateError?.message ?? null,
        },
        { status: 400 },
      );
    }

    const { data: rawTopTypes, error: topTypesError } = await supabase
      .from("v_top_content_types_by_shop")
      .select("content_type, avg_engagement_score, total_views")
      .eq("shop_id", asset.shop_id)
      .order("avg_engagement_score", { ascending: false })
      .limit(5);

    if (topTypesError) {
      return NextResponse.json(
        {
          error: "Failed to load learning signals",
          details: topTypesError.message,
        },
        { status: 500 },
      );
    }

    const topPerformingTypes = ((rawTopTypes ?? []) as TopPerformingType[]).filter(
      (row) => typeof row.content_type === "string" && row.content_type.length > 0,
    );

    const visualUrls = buildVisualUrls(files);
    const transcript =
      buildTranscript(asset) ||
      "Real shop content captured from uploaded photos and video.";

    const generated = await generateVideoConcept({
      workOrder: {
        id: asset.id,
        customId: asset.id,
        shopId: asset.shop_id,
        customerName: null,
        vehicle: null,
        concern: asset.description ?? asset.note ?? "Manual uploaded shop content",
        findings: asset.description ? [asset.description] : [],
        recommendedWork: [],
        completedWork: asset.note ? [asset.note] : [asset.title],
      },
      template: {
        id: template.id,
        key: template.slug ?? template.name,
        name: template.name,
        description: template.description,
        default_hook: getTemplateConfigValue(template.config, "default_hook"),
        default_cta: getTemplateConfigValue(template.config, "default_cta"),
        script_guidance: getTemplateConfigValue(template.config, "script_guidance"),
        visual_guidance: getTemplateConfigValue(template.config, "visual_guidance"),
      },
      topPerformingTypes: topPerformingTypes.map((row) => ({
        content_type: row.content_type as string,
        avg_engagement_score: row.avg_engagement_score,
        total_views: row.total_views,
        total_leads: null,
      })),
    });

    const pieceInsert: PieceInsertShape = {
      tenant_shop_id: asset.shop_id,
      source_shop_id: asset.shop_id,
      source_system: "profixiq",
      source_media_upload_id: asset.id,
      template_id: template.id,
      title: generated.title || asset.title,
      status: "draft",
      content_type: generated.contentType,
      hook: generated.hook,
      caption: generated.caption,
      cta: generated.cta,
      script_text: generated.scriptText,
      voiceover_text: generated.voiceoverText,
      platform_targets: mapGeneratedPlatformTargets(generated.platformTargets),
      metadata: {
        source: "manual_upload",
        manualAssetId: asset.id,
        originalTitle: asset.title,
        originalDescription: asset.description,
        originalNote: asset.note,
        captionByPlatform: generated.captionByPlatform,
        hashtagsByPlatform: generated.hashtagsByPlatform,
        shotList: generated.shotList,
        engagementPrediction: generated.engagementPrediction,
        aiScore: generated.aiScore,
      },
    };

    const { data: createdPieceData, error: pieceError } = await supabase
      .from("content_pieces")
      .insert(pieceInsert as never)
      .select("id")
      .single();

    const createdPiece = createdPieceData as { id: string } | null;

    if (pieceError || !createdPiece) {
      return NextResponse.json(
        {
          error: "Failed to create content piece",
          details: pieceError?.message ?? null,
        },
        { status: 500 },
      );
    }

    const { error: assetUpdateError } = await supabase
      .from("shopreel_manual_assets")
      .update({
        status: "ready",
      })
      .eq("id", asset.id);

    if (assetUpdateError) {
      return NextResponse.json(
        {
          error: "Content piece created, but manual asset status update failed",
          contentPieceId: createdPiece.id,
          details: assetUpdateError.message,
        },
        { status: 207 },
      );
    }

    let renderJobId: string | null = null;

    if (enqueueRender) {
      const plan = buildAutoEditPlan({
        title: generated.title,
        contentType: generated.contentType,
        hook: generated.hook,
        caption: generated.caption,
        cta: generated.cta,
        transcript: generated.voiceoverText || transcript,
        durationMs:
          typeof asset.duration_seconds === "number" && asset.duration_seconds > 0
            ? Math.round(asset.duration_seconds * 1000)
            : 12000,
        visualUrls,
      });

      const job = await createRenderJob({
        shopId: asset.shop_id,
        workOrderId: null,
        sourceType: "manual_upload",
        sourceId: asset.id,
        createdBy: asset.created_by,
        renderPayload: plan.renderPayload,
      });

      renderJobId =
        job && typeof job === "object" && "id" in job && typeof job.id === "string"
          ? job.id
          : null;

      const { error: pieceQueueError } = await supabase
        .from("content_pieces")
        .update({
          status: "queued",
        })
        .eq("id", createdPiece.id);

      if (pieceQueueError) {
        return NextResponse.json(
          {
            error: "Content piece created, but queue status update failed",
            contentPieceId: createdPiece.id,
            renderJobId,
            details: pieceQueueError.message,
          },
          { status: 207 },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      assetId: asset.id,
      contentPieceId: createdPiece.id,
      renderJobId,
      concept: {
        title: generated.title,
        contentType: generated.contentType,
        hook: generated.hook,
        caption: generated.caption,
        cta: generated.cta,
        scriptText: generated.scriptText,
        voiceoverText: generated.voiceoverText,
        platformTargets: generated.platformTargets,
        aiScore: generated.aiScore,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}