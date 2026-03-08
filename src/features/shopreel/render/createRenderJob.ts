import { createAdminClient } from "@/lib/supabase/server";

export type CreateRenderJobInput = {
  shopId: string;
  workOrderId?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  createdBy?: string | null;
  renderPayload: unknown;
};

export async function createRenderJob(input: CreateRenderJobInput) {
  const supabase = createAdminClient();

  const payload = {
    shop_id: input.shopId,
    work_order_id: input.workOrderId ?? null,
    source_type: input.sourceType ?? null,
    source_id: input.sourceId ?? null,
    created_by: input.createdBy ?? null,
    status: "queued",
    render_payload: input.renderPayload,
  };

  const { data, error } = await supabase
    .from("reel_render_jobs")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
