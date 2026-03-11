import { createAdminClient } from "@/lib/supabase/server";
import { scoreViralMoment } from "./scoreViralMoment";

type WorkOrderLineRow = {
  id: string;
  description: string | null;
  cause: string | null;
  correction: string | null;
  work_order_id: string | null;
};

export async function detectViralMoments(shopId: string) {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data, error } = await legacy
    .from("work_order_lines")
    .select("id, description, cause, correction, work_order_id")
    .eq("shop_id", shopId)
    .eq("status", "completed")
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const lines = (data ?? []) as WorkOrderLineRow[];

  const moments = lines.map((line) => {
    const text = `${line.description ?? ""} ${line.cause ?? ""} ${line.correction ?? ""}`;
    const viral = scoreViralMoment(text);

    return {
      sourceType: "work_order_line",
      sourceId: line.id,
      workOrderId: line.work_order_id,
      title: line.description ?? "Completed repair",
      trigger: "Cause + correction + completed repair",
      viralScore: viral.score,
      reason: viral.reason,
    };
  });

  return moments.sort((a, b) => b.viralScore - a.viralScore).slice(0, 10);
}
