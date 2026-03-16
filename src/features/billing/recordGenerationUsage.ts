import { createAdminClient } from "@/lib/supabase/server";
import { getSubscription } from "./getSubscription";
import { ensureUsagePeriod } from "./ensureUsagePeriod";

export async function recordGenerationUsage(input: {
  shopId: string;
  generationId?: string | null;
  source: string;
  mode?: string | null;
  outputType?: string | null;
}) {
  const supabase = createAdminClient();
  const subscription = await getSubscription(input.shopId);
  const usagePeriod = await ensureUsagePeriod(input.shopId, subscription);

  const nextCount = Number(usagePeriod.generations_used ?? 0) + 1;

  const { data, error } = await supabase
    .from("shopreel_usage_periods")
    .update({
      generations_used: nextCount,
      metadata: {
        ...(usagePeriod as { metadata?: Record<string, unknown> }).metadata,
        last_generation_id: input.generationId ?? null,
        last_generation_source: input.source,
        last_generation_mode: input.mode ?? null,
        last_output_type: input.outputType ?? null,
        last_incremented_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", usagePeriod.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
