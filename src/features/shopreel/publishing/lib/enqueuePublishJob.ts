import { createAdminClient } from "@/lib/supabase/server";
import type { EnqueuePublishJobInput } from "../types";

export async function enqueuePublishJob(input: EnqueuePublishJobInput) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("shopreel_publish_jobs")
    .insert({
      shop_id: input.shopId,
      publication_id: input.publicationId,
      status: "queued",
      run_after: input.runAfter ?? new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to enqueue publish job");
  }

  return data;
}