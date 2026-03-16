import { createAdminClient } from "@/lib/supabase/server";
import { createRenderJob } from "@/features/shopreel/render/createRenderJob";

type CalendarItemRow = {
  id: string;
  content_piece_id: string | null;
  tenant_shop_id: string;
  scheduled_for: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
};

type ContentPieceRow = {
  id: string;
  tenant_shop_id: string;
  title: string;
  content_type: string | null;
  hook: string | null;
  caption: string | null;
  cta: string | null;
  metadata: Record<string, unknown> | null;
  source_work_order_id: string | null;
};

function safeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function queueScheduledContent(input: {
  shopId: string;
  contentPieceId?: string | null;
}) {
  const supabase = createAdminClient();

  let calendarQuery = supabase
    .from("content_calendar_items")
    .select("id, content_piece_id, tenant_shop_id, scheduled_for, status, metadata")
    .eq("tenant_shop_id", input.shopId)
    .eq("status", "planned")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(25);

  if (input.contentPieceId) {
    calendarQuery = calendarQuery.eq("content_piece_id", input.contentPieceId);
  }

  const { data: rawItems, error: itemsError } = await calendarQuery;

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const items = (rawItems ?? []) as CalendarItemRow[];

  if (items.length === 0) {
    return {
      ok: true,
      queued: 0,
      renderJobsCreated: 0,
      itemIds: [],
    };
  }

  let queued = 0;
  let renderJobsCreated = 0;

  for (const item of items) {
    if (!item.content_piece_id) continue;

    const { data: pieceData, error: pieceError } = await supabase
      .from("content_pieces")
      .select("id, tenant_shop_id, title, content_type, hook, caption, cta, metadata, source_work_order_id")
      .eq("id", item.content_piece_id)
      .maybeSingle();

    if (pieceError) {
      throw new Error(pieceError.message);
    }

    const piece = (pieceData ?? null) as ContentPieceRow | null;

    if (!piece) continue;

    const { error: pieceUpdateError } = await supabase
      .from("content_pieces")
      .update({
        status: "queued",
        updated_at: new Date().toISOString(),
      })
      .eq("id", piece.id);

    if (pieceUpdateError) {
      throw new Error(pieceUpdateError.message);
    }

    const metadata = safeObject(piece.metadata);
    const calendarMetadata = safeObject(item.metadata);

    const existingRenderJob = await supabase
      .from("reel_render_jobs")
      .select("id")
      .eq("shop_id", input.shopId)
      .eq("content_piece_id", piece.id)
      .in("status", ["queued", "processing", "completed"])
      .limit(1)
      .maybeSingle();

    if (existingRenderJob.error) {
      throw new Error(existingRenderJob.error.message);
    }

    if (!existingRenderJob.data?.id) {
      await createRenderJob({
        shopId: input.shopId,
        contentPieceId: piece.id,
        workOrderId: piece.source_work_order_id,
        sourceType:
          typeof metadata.story_source_kind === "string"
            ? metadata.story_source_kind
            : typeof calendarMetadata.source_type === "string"
              ? calendarMetadata.source_type
              : piece.content_type ?? "workflow_demo",
        sourceId:
          typeof metadata.story_source_id === "string"
            ? metadata.story_source_id
            : typeof calendarMetadata.source_id === "string"
              ? calendarMetadata.source_id
              : piece.id,
        renderPayload: {
          mode: "scheduled_calendar_render",
          title: piece.title,
          hook: piece.hook,
          caption: piece.caption,
          cta: piece.cta,
          content_type: piece.content_type,
          metadata,
          calendar_metadata: calendarMetadata,
        },
      });

      renderJobsCreated += 1;
    }

    const { error: calendarUpdateError } = await supabase
      .from("content_calendar_items")
      .update({
        status: "queued",
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (calendarUpdateError) {
      throw new Error(calendarUpdateError.message);
    }

    queued += 1;
  }

  return {
    ok: true,
    queued,
    renderJobsCreated,
    itemIds: items.map((item) => item.id),
  };
}
