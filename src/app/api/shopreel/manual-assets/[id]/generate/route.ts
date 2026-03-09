// src/app/api/shopreel/manual-assets/[id]/generate/route.ts

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
  manual_asset_id: string;
  file_path: string;
  file_name: string;
  file_type: "image" | "video";
  mime_type: string;
  sort_order: number;
  duration_seconds: number | null;
};

type ContentTemplateRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  default_hook: string | null;
  default_cta: string | null;
  script_guidance: string | null;
  visual_guidance: string | null;
};

type TopPerformingType = {
  content_type: string;
  avg_engagement_score: number | null;
  total_views: number | null;
  total_leads: number | null;
};

type VideoInsertShape = {
  shop_id: string;
  template_id: string;
  source_asset_id: string;
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
  hook: string;
  caption: string;
  cta: string;
  script_text: string;
  voiceover_text: string;
  platform_targets: string[];
  generation_notes: string;
  ai_score: number;
  created_by: string | null;
};

type AIGenerationRunInsertShape = {
  shop_id: string;
  video_id: string;
  template_id: string;
  requested_by: string | null;
  provider: string;
  model: string;
  prompt_version: string;
  user_prompt: string;
  input_payload: {
    manualAssetId: string;
    contentGoal: string | null;
    title: string;
    description: string | null;
    note: string | null;
    assetType: string;
    visualUrls: string[];
  };
  output_payload: unknown;
  status: "completed";
  started_at: string;
  completed_at: string;
  score_predicted: number;
};

function mapContentGoalToTemplateKey(
  contentGoal: string | null | undefined,
): ContentTemplateRow["key"] {
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
): string[] {
  return targets.map((target) => {
    switch (target) {
      case "instagram":
        return "instagram_reels";
      case "facebook":
        return "facebook";
      case "tiktok":
        return "tiktok";
      case "youtube":
        return "youtube_shorts";
      default:
        return target;
    }
  });
}

function buildVisualUrls(files: ManualAssetFileRow[]): string[] {
  return files
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((file) => file.file_path)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .slice(0, 4);
}

function buildTranscript(asset: ManualAssetRow): string {
  return [
    asset.title,
    asset.description ?? "",
    asset.note ?? "",
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(". ");
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
        "id, manual_asset_id, file_path, file_name, file_type, mime_type, sort_order, duration_seconds",
      )
      .eq("manual_asset_id", asset.id)
      .order("sort_order", { ascending: true });

    const files = (filesData ?? []) as ManualAssetFileRow[];

    if (filesError || files.length === 0) {
      return NextResponse.json(
        { error: filesError?.message ?? "Manual asset files not found" },
        { status: 400 },
      );
    }

    const templateKey = mapContentGoalToTemplateKey(asset.content_goal);

    const { data: templateData, error: templateError } = await supabase
      .from("content_templates")
      .select(
        "id, key, name, description, default_hook, default_cta, script_guidance, visual_guidance",
      )
      .eq("shop_id", asset.shop_id)
      .eq("key", templateKey)
      .eq("is_active", true)
      .maybeSingle();

    const template = templateData as ContentTemplateRow | null;

    if (templateError || !template) {
      return NextResponse.json(
        {
          error: `No active content template found for ${templateKey}`,
          details: templateError?.message ?? null,
        },
        { status: 400 },
      );
    }

    const { data: rawTopTypes, error: topTypesError } = await supabase
      .from("v_top_content_types_by_shop")
      .select("content_type, avg_engagement_score, total_views, total_leads")
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
        key: template.key,
        name: template.name,
        description: template.description,
        default_hook: template.default_hook,
        default_cta: template.default_cta,
        script_guidance: template.script_guidance,
        visual_guidance: template.visual_guidance,
      },
      topPerformingTypes,
    });

    const videoInsert: VideoInsertShape = {
      shop_id: asset.shop_id,
      template_id: template.id,
      source_asset_id: asset.id,
      title: generated.title || asset.title,
      status: "draft",
      content_type: generated.contentType,
      hook: generated.hook,
      caption: generated.caption,
      cta: generated.cta,
      script_text: generated.scriptText,
      voiceover_text: generated.voiceoverText,
      platform_targets: mapGeneratedPlatformTargets(generated.platformTargets),
      generation_notes: JSON.stringify({
        source: "manual_upload",
        manualAssetId: asset.id,
        originalTitle: asset.title,
        originalDescription: asset.description,
        originalNote: asset.note,
        captionByPlatform: generated.captionByPlatform,
        hashtagsByPlatform: generated.hashtagsByPlatform,
        shotList: generated.shotList,
        engagementPrediction: generated.engagementPrediction,
      }),
      ai_score: generated.aiScore,
      created_by: asset.created_by,
    };

    const { data: createdVideoData, error: videoError } = await supabase
      .from("videos")
      .insert(videoInsert as never)
      .select("id")
      .single();

    const createdVideo = createdVideoData as { id: string } | null;

    if (videoError || !createdVideo) {
      return NextResponse.json(
        {
          error: "Failed to create video record",
          details: videoError?.message ?? null,
        },
        { status: 500 },
      );
    }

    const runInsert: AIGenerationRunInsertShape = {
      shop_id: asset.shop_id,
      video_id: createdVideo.id,
      template_id: template.id,
      requested_by: asset.created_by,
      provider: "openai",
      model: "gpt-5-mini",
      prompt_version: "manual-upload-v1",
      user_prompt: `Generated from manual ShopReel asset ${asset.id}`,
      input_payload: {
        manualAssetId: asset.id,
        contentGoal: asset.content_goal,
        title: asset.title,
        description: asset.description,
        note: asset.note,
        assetType: asset.asset_type,
        visualUrls,
      },
      output_payload: generated,
      status: "completed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      score_predicted: generated.aiScore,
    };

    const { error: runError } = await supabase
      .from("ai_generation_runs")
      .insert(runInsert as never);

    if (runError) {
      return NextResponse.json(
        {
          error: "Video created, but generation run logging failed",
          videoId: createdVideo.id,
          details: runError.message,
        },
        { status: 207 },
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
          error: "Video created, but manual asset status update failed",
          videoId: createdVideo.id,
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

      if (renderJobId) {
        const { error: renderUpdateError } = await supabase
          .from("reel_render_jobs")
          .update({
            video_id: createdVideo.id,
          })
          .eq("id", renderJobId);

        if (renderUpdateError) {
          return NextResponse.json(
            {
              error: "Video created, but render job video link failed",
              videoId: createdVideo.id,
              renderJobId,
              details: renderUpdateError.message,
            },
            { status: 207 },
          );
        }

        const { error: videoQueueError } = await supabase
          .from("videos")
          .update({
            status: "queued",
          })
          .eq("id", createdVideo.id);

        if (videoQueueError) {
          return NextResponse.json(
            {
              error: "Video created, but video queue status update failed",
              videoId: createdVideo.id,
              renderJobId,
              details: videoQueueError.message,
            },
            { status: 207 },
          );
        }
      }
    }

    return NextResponse.json({
      ok: true,
      assetId: asset.id,
      videoId: createdVideo.id,
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