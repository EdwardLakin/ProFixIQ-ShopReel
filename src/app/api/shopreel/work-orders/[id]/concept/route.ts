import { NextRequest, NextResponse } from "next/server";
import { generateVideoConcept } from "@/features/ai/server/generateVideoConcept";
import { createAdminClient } from "@/lib/supabase/server";

type Params = {
  params: Promise<{ id: string }>;
};

type ShopUserLite = {
  shop_id: string;
  user_id: string;
};

type ShopMembershipLite = {
  shop_id: string;
};

type WorkOrderLineLite = {
  id: string;
  description: string | null;
  complaint: string | null;
  cause: string | null;
  correction: string | null;
  notes: string | null;
  status: string | null;
  line_status: string | null;
  job_type: string | null;
  labor_time: number | null;
  line_no: number | null;
  approval_state: string | null;
  urgency: string | null;
  price_estimate: number | null;
};

type CustomerLite = {
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
};

type VehicleLite = {
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
};

type WorkOrderWithRelations = {
  id: string;
  custom_id: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  notes: string | null;
  customer_name: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_vin: string | null;
  customers: CustomerLite | null;
  vehicles: VehicleLite | null;
  work_order_lines: WorkOrderLineLite[] | null;
};

type TopPerformingType = {
  content_type: string;
  avg_engagement_score: number | null;
  total_views: number | null;
  total_leads: number | null;
};

type ContentTemplateRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  config: Record<string, unknown> | null;
};

type VideoInsertShape = {
  shop_id: string;
  template_id: string;
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
  created_by: string;
};

type AIGenerationRunInsertShape = {
  shop_id: string;
  video_id: string;
  template_id: string;
  requested_by: string;
  provider: string;
  model: string;
  prompt_version: string;
  user_prompt: string;
  input_payload: {
    workOrderId: string;
    contentType: string;
    findings: string[];
    recommendedWork: string[];
    completedWork: string[];
  };
  output_payload: unknown;
  status: "completed";
  started_at: string;
  completed_at: string;
  score_predicted: number;
};

type AuthContext = {
  userId: string;
  shopId: string;
};

function getTemplateConfigValue(
  config: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = config?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

async function resolveAuthContext(
  req: NextRequest,
): Promise<
  { ok: true; value: AuthContext } | { ok: false; response: NextResponse }
> {
  const supabase = createAdminClient();
  const supabaseAny = supabase as any;

  const devBypassToken = process.env.SHOPREEL_DEV_BYPASS_TOKEN;
  const requestDevToken = req.headers.get("x-shopreel-dev-token");

  if (
    process.env.NODE_ENV !== "production" &&
    devBypassToken &&
    requestDevToken === devBypassToken
  ) {
    const { data: membershipData, error: membershipError } = await supabaseAny
      .from("shop_users")
      .select("shop_id, user_id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const membership = membershipData as ShopUserLite | null;

    if (membershipError || !membership?.shop_id || !membership?.user_id) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Dev bypass could not find an active shop user" },
          { status: 500 },
        ),
      };
    }

    return {
      ok: true,
      value: {
        userId: membership.user_id,
        shopId: membership.shop_id,
      },
    };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: membershipData, error: membershipError } = await supabaseAny
    .from("shop_users")
    .select("shop_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const membership = membershipData as ShopMembershipLite | null;

  if (membershipError || !membership?.shop_id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No active shop membership found" },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    value: {
      userId: user.id,
      shopId: membership.shop_id,
    },
  };
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const auth = await resolveAuthContext(req);
  if (!auth.ok) {
    return auth.response;
  }

  const { userId, shopId } = auth.value;
  const supabase = createAdminClient();
  const supabaseAny = supabase as any;

  const { data: workOrderData, error: woError } = await supabaseAny
    .from("work_orders")
    .select(
      `
      id,
      custom_id,
      customer_id,
      vehicle_id,
      notes,
      customer_name,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      vehicle_vin,
      customers (
        name,
        first_name,
        last_name,
        business_name
      ),
      vehicles (
        year,
        make,
        model,
        vin
      ),
      work_order_lines (
        id,
        description,
        complaint,
        cause,
        correction,
        notes,
        status,
        line_status,
        job_type,
        labor_time,
        line_no,
        approval_state,
        urgency,
        price_estimate
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  const workOrder = workOrderData as WorkOrderWithRelations | null;

  if (woError || !workOrder) {
    return NextResponse.json(
      { error: "Work order not found", details: woError?.message ?? null },
      { status: 404 },
    );
  }

  const lines: WorkOrderLineLite[] = Array.isArray(workOrder.work_order_lines)
    ? workOrder.work_order_lines
    : [];

  const completedWork = lines
    .filter((line) => line.status === "completed" || Boolean(line.correction))
    .map((line) => {
      return (
        line.correction ||
        line.description ||
        line.complaint ||
        "Completed repair"
      );
    });

  const findings = lines
    .filter(
      (line) =>
        line.status !== "completed" &&
        Boolean(line.complaint || line.cause || line.notes),
    )
    .map((line) => {
      return (
        line.cause ||
        line.complaint ||
        line.notes ||
        line.description ||
        "Inspection finding"
      );
    });

  const recommendedWork = lines
    .filter(
      (line) =>
        line.job_type === "repair" ||
        line.job_type === "maintenance" ||
        line.approval_state === "pending" ||
        line.status === "awaiting_approval" ||
        line.status === "queued",
    )
    .map((line) => {
      return (
        line.description ||
        line.complaint ||
        line.notes ||
        "Recommended work"
      );
    });

  const contentType =
    completedWork.length > 0
      ? "repair_story"
      : findings.length > 0
        ? "inspection_highlight"
        : "workflow_demo";

  const { data: templateData, error: templateError } = await supabase
    .from("content_templates")
    .select("id,name,slug,description,config")
    .eq("tenant_shop_id", shopId)
    .eq("slug", contentType)
    .eq("is_active", true)
    .maybeSingle();

  const template = templateData as ContentTemplateRow | null;

  if (templateError || !template) {
    return NextResponse.json(
      {
        error: `No active template found for ${contentType}`,
        details: templateError?.message ?? null,
      },
      { status: 400 },
    );
  }

  const { data: rawTopTypes, error: topTypesError } = await supabase
    .from("v_top_content_types_by_shop")
    .select("content_type, avg_engagement_score, total_views")
    .eq("shop_id", shopId)
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

  const topPerformingTypes: TopPerformingType[] = ((rawTopTypes ?? []) as Array<{
    content_type: string | null;
    avg_engagement_score: number | null;
    total_views: number | null;
  }>)
    .filter((row) => typeof row.content_type === "string" && row.content_type.length > 0)
    .map((row) => ({
      content_type: row.content_type as string,
      avg_engagement_score: row.avg_engagement_score,
      total_views: row.total_views,
      total_leads: null,
    }));

  const customerName =
    workOrder.customers?.name ||
    [workOrder.customers?.first_name, workOrder.customers?.last_name]
      .filter((value): value is string => Boolean(value))
      .join(" ") ||
    workOrder.customers?.business_name ||
    workOrder.customer_name ||
    null;

  const generated = await generateVideoConcept({
    workOrder: {
      id: workOrder.id,
      customId: workOrder.custom_id,
      shopId,
      customerName,
      vehicle: {
        year: workOrder.vehicles?.year ?? workOrder.vehicle_year ?? null,
        make: workOrder.vehicles?.make ?? workOrder.vehicle_make ?? null,
        model: workOrder.vehicles?.model ?? workOrder.vehicle_model ?? null,
        vin: workOrder.vehicles?.vin ?? workOrder.vehicle_vin ?? null,
      },
      concern:
        workOrder.notes ??
        lines.find((line) => Boolean(line.complaint))?.complaint ??
        null,
      findings,
      recommendedWork,
      completedWork,
    },
    template: {
      id: template.id,
      key: template.slug ?? contentType,
      name: template.name,
      description: template.description,
      default_hook: getTemplateConfigValue(template.config, "default_hook"),
      default_cta: getTemplateConfigValue(template.config, "default_cta"),
      script_guidance: getTemplateConfigValue(template.config, "script_guidance"),
      visual_guidance: getTemplateConfigValue(template.config, "visual_guidance"),
    },
    topPerformingTypes,
  });

  const videoInsert: VideoInsertShape = {
    shop_id: shopId,
    template_id: template.id,
    title: generated.title,
    status: "draft",
    content_type: generated.contentType,
    hook: generated.hook,
    caption: generated.caption,
    cta: generated.cta,
    script_text: generated.scriptText,
    voiceover_text: generated.voiceoverText,
    platform_targets: generated.platformTargets,
    generation_notes: JSON.stringify({
      notes: generated.generationNotes,
      engagementPrediction: generated.engagementPrediction,
      captionByPlatform: generated.captionByPlatform,
      hashtagsByPlatform: generated.hashtagsByPlatform,
      shotList: generated.shotList,
    }),
    ai_score: generated.aiScore,
    created_by: userId,
  };

  const { data: createdVideoData, error: videoError } = await supabaseAny
    .from("videos")
    .insert(videoInsert)
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
    shop_id: shopId,
    video_id: createdVideo.id,
    template_id: template.id,
    requested_by: userId,
    provider: "openai",
    model: "gpt-5-mini",
    prompt_version: "v2",
    user_prompt: `Generated from work order ${workOrder.custom_id ?? workOrder.id}`,
    input_payload: {
      workOrderId: workOrder.id,
      contentType,
      findings,
      recommendedWork,
      completedWork,
    },
    output_payload: generated,
    status: "completed",
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    score_predicted: generated.aiScore,
  };

  const { error: runError } = await supabaseAny
    .from("ai_generation_runs")
    .insert(runInsert);

  if (runError) {
    return NextResponse.json(
      {
        error: "Video created, but generation run logging failed",
        video: createdVideo,
        details: runError.message,
      },
      { status: 207 },
    );
  }

  return NextResponse.json({
    ok: true,
    video: createdVideo,
    concept: generated,
  });
}
