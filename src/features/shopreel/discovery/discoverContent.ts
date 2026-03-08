import { createAdminClient } from "@/lib/supabase/server";

type DiscoverableWorkOrder = {
  id: string;
  custom_id: string | null;
  complaint: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
};

type DiscoverableLine = {
  work_order_id: string;
  description: string | null;
  cause: string | null;
  correction: string | null;
  status: string | null;
  job_type: string | null;
};

type ContentOpportunity = {
  workOrderId: string;
  title: string;
  contentType: string;
  hook: string;
  reason: string;
};

export async function discoverContent(shopId: string) {
  const supabase = createAdminClient();

  const { data: workOrders, error: woError } = await supabase
    .from("work_orders")
    .select("id, custom_id, vehicle_make, vehicle_model, vehicle_year")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (woError) {
    throw new Error(woError.message);
  }

  const { data: lines, error: lineError } = await supabase
    .from("work_order_lines")
    .select("work_order_id, description, cause, correction, status, job_type")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (lineError) {
    throw new Error(lineError.message);
  }

  const workOrderRows = (workOrders ?? []) as DiscoverableWorkOrder[];
  const lineRows = (lines ?? []) as DiscoverableLine[];

  const opportunities: ContentOpportunity[] = [];

  for (const workOrder of workOrderRows) {
    const relatedLines = lineRows.filter(
      (line) => line.work_order_id === workOrder.id,
    );

    const completedRepair = relatedLines.find(
      (line) =>
        line.status === "completed" &&
        (line.job_type === "repair" || line.job_type === "maintenance"),
    );

    if (completedRepair) {
      opportunities.push({
        workOrderId: workOrder.id,
        title: `${workOrder.vehicle_year ?? ""} ${workOrder.vehicle_make ?? ""} ${workOrder.vehicle_model ?? ""}`.trim() || "Completed repair",
        contentType: "repair_story",
        hook:
          completedRepair.cause && completedRepair.correction
            ? `Customer came in with ${completedRepair.cause.toLowerCase()} — here’s how we fixed it.`
            : "Here’s how this repair moved through the shop.",
        reason: "Completed repair line found",
      });
      continue;
    }

    const findingLine = relatedLines.find(
      (line) => line.status !== "completed" && !!line.description,
    );

    if (findingLine) {
      opportunities.push({
        workOrderId: workOrder.id,
        title: findingLine.description ?? "Inspection finding",
        contentType: "inspection_highlight",
        hook: `We found this during an inspection on a ${workOrder.vehicle_year ?? ""} ${workOrder.vehicle_make ?? ""} ${workOrder.vehicle_model ?? ""}.`,
        reason: "Open finding / recommended work found",
      });
      continue;
    }

    opportunities.push({
      workOrderId: workOrder.id,
      title:
        workOrder.complaint ??
        `${workOrder.vehicle_year ?? ""} ${workOrder.vehicle_make ?? ""} ${workOrder.vehicle_model ?? ""}`.trim() ??
        "Shop workflow demo",
      contentType: "workflow_demo",
      hook: "See how this vehicle moved through the shop without the usual chaos.",
      reason: "Fallback workflow content opportunity",
    });
  }

  return opportunities.slice(0, 12);
}
