import { NextRequest, NextResponse } from "next/server";
import { generateVideoConcept } from "@/features/ai/server/generateVideoConcept";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type DB = Database;

type Params = {
  params: Promise<{ id: string }>;
};

type WorkOrderLineLite = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  job_type: string | null;
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
  complaint: string | null;
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

type VideoInsert = DB["public"]["Tables"]["videos"]["Insert"];
type AIGenerationRunInsert =
  DB["public"]["Tables"]["ai_generation_runs"]["Insert"];

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("shop_users")
    .select("shop_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership?.shop_id) {
    return NextResponse.json(
      { error: "No active shop membership found" },
      { status: 403 },
    );
  }

  const shopId = membership.shop_id;

  const { data, error: woError } = await supabase
    .from("work_orders")
    .select(
      `
      id,
      custom_id,
      customer_id,
      vehicle_id,
      complaint,
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
        title,
        description,
        status,
        job_type
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  const workOrder = data as WorkOrderWithRelations | null;

  if (woError || !workOrder) {
    return NextResponse.json(
      { error: "Work order not found" },
      { status: 404 },
    );
  }

  const lines: WorkOrderLineLite[] = Array.isArray(workOrder.work_order_lines)
    ? workOrder.work_order_lines
    : [];

  const completedWork = lines
    .filter((line: WorkOrderLineLite) => line.status === "completed")
    .map(
      (line: WorkOrderLineLite) =>
        line.title || line.description || "Completed repair",
    );

  const findings = lines
    .filter((line: WorkOrderLineLite) => line.status !== "completed")
    .map(
      (line: WorkOrderLineLite) =>
        line.title || line.description || "Inspection finding",
    );

  const recommendedWork = lines
    .filter(
      (line: WorkOrderLineLite) =>
        line.job_type === "repair" || line.job_type === "maintenance",
    )
    .map(
      (line: WorkOrderLineLite) =>
        line.title || line.description || "Recommended work",
    );

  const contentType =
    completedWork.length > 0
      ? "repair_story"
      : findings.length > 0
        ? "inspection_highlight"
        : "workflow_demo";

  const { data: template, error: templateError } = await supabase
    .from("content_templates")
    .select("*")
    .eq("shop_id", shopId)
    .eq("key", contentType)
    .eq("is_active", true)
    .maybeSingle();

  if (templateError || !template) {
    return NextResponse.json(
      { error: `No active template found for ${contentType}` },
      { status: 400 },
    );
  }

  const { data: rawTopTypes, error: topTypesError } = await supabase
    .from("v_top_content_types_by_shop")
    .select("content_type, avg_engagement_score, total_views, total_leads")
    .eq("shop_id", shopId)
    .order("avg_engagement_score", { ascending: false })
    .limit(5);

  if (topTypesError) {
    return NextResponse.json(
      { error: "Failed to load learning signals", details: topTypesError.message },
      { status: 500 },
    );
  }

  const topPerformingTypes: TopPerformingType[] = (rawTopTypes ?? [])
    .filter(
      (
        row,
      ): row is {
        content_type: string;
        avg_engagement_score: number | null;
        total_views: number | null;
        total_leads: number | null;
      } => typeof row.content_type === "string" && row.content_type.length > 0,
    )
    .map((row) => ({
      content_type: row.content_type,
      avg_engagement_score: row.avg_engagement_score,
      total_views: row.total_views,
      total_leads: row.total_leads,
    }));

  const customerName =
    workOrder.customers?.name ||
    [workOrder.customers?.first_name, workOrder.customers?.last_name]
      .filter((value): value is string => Boolean(value))
      .join(" ") ||
    workOrder.customers?.business_name ||
    null;

  const generated = await generateVideoConcept({
    workOrder: {
      id: workOrder.id,
      customId: workOrder.custom_id,
      shopId,
      customerName,
      vehicle: {
        year: workOrder.vehicles?.year ?? null,
        make: workOrder.vehicles?.make ?? null,
        model: workOrder.vehicles?.model ?? null,
        vin: workOrder.vehicles?.vin ?? null,
      },
      concern: workOrder.complaint ?? null,
      findings,
      recommendedWork,
      completedWork,
    },
    template,
    topPerformingTypes,
  });

  const videoInsert: VideoInsert = {
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
    generation_notes: generated.generationNotes,
    ai_score: generated.aiScore,
    created_by: user.id,
  };

  const { data: createdVideo, error: videoError } = await supabase
    .from("videos")
    .insert(videoInsert)
    .select("*")
    .single();

  if (videoError || !createdVideo) {
    return NextResponse.json(
      { error: "Failed to create video record", details: videoError.message },
      { status: 500 },
    );
  }

  const runInsert: AIGenerationRunInsert = {
    shop_id: shopId,
    video_id: createdVideo.id,
    template_id: template.id,
    requested_by: user.id,
    provider: "openai",
    model: "gpt-5-mini",
    prompt_version: "v1",
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

  const { error: runError } = await supabase
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