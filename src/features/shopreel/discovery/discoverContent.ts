import { createAdminClient } from "@/lib/supabase/server";

type DiscoverableWorkOrder = {
  id: string;
  custom_id: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
};

type DiscoverableLine = {
  id: string;
  work_order_id: string;
  description: string | null;
  cause: string | null;
  correction: string | null;
  status: string | null;
  job_type: string | null;
};

type InspectionItemRow = {
  id: string;
  inspection_id: string | null;
  label?: string | null;
  name?: string | null;
  status?: string | null;
  notes?: string | null;
};

type InspectionPhotoRow = {
  id: string;
  inspection_id: string | null;
  photo_url?: string | null;
  url?: string | null;
  created_at?: string | null;
};

type VehicleMediaRow = {
  id: string;
  vehicle_id: string | null;
  media_url?: string | null;
  url?: string | null;
  kind?: string | null;
  created_at?: string | null;
};

export type ContentOpportunity = {
  sourceType:
    | "inspection_item"
    | "inspection_photo"
    | "vehicle_media"
    | "repair_story"
    | "mechanic_tip"
    | "workflow_demo";
  workOrderId: string | null;
  sourceId: string;
  title: string;
  contentType:
    | "inspection_highlight"
    | "before_after"
    | "repair_story"
    | "educational_tip"
    | "workflow_demo";
  hook: string;
  reason: string;
  visualUrls: string[];
};

function vehicleLabel(workOrder: DiscoverableWorkOrder): string {
  return (
    `${workOrder.vehicle_year ?? ""} ${workOrder.vehicle_make ?? ""} ${workOrder.vehicle_model ?? ""}`.trim() ||
    "vehicle"
  );
}

function getInspectionItemLabel(item: InspectionItemRow): string {
  return (
    (typeof item.label === "string" && item.label.length > 0 ? item.label : null) ||
    (typeof item.name === "string" && item.name.length > 0 ? item.name : null) ||
    "inspection finding"
  );
}

function getPhotoUrl(photo: InspectionPhotoRow): string | null {
  return (
    (typeof photo.photo_url === "string" && photo.photo_url.length > 0 ? photo.photo_url : null) ||
    (typeof photo.url === "string" && photo.url.length > 0 ? photo.url : null)
  );
}

function getVehicleMediaUrl(media: VehicleMediaRow): string | null {
  return (
    (typeof media.media_url === "string" && media.media_url.length > 0 ? media.media_url : null) ||
    (typeof media.url === "string" && media.url.length > 0 ? media.url : null)
  );
}

export async function discoverContent(shopId: string): Promise<ContentOpportunity[]> {
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
    .select("id, work_order_id, description, cause, correction, status, job_type")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(150);

  if (lineError) {
    throw new Error(lineError.message);
  }

  const inspectionItemsResult = await supabase
    .from("inspection_items")
    .select("*")
    .limit(150);

  const inspectionPhotosResult = await supabase
    .from("inspection_photos")
    .select("*")
    .limit(150);

  const vehicleMediaResult = await supabase
    .from("vehicle_media")
    .select("*")
    .limit(150);

  const workOrderRows = (workOrders ?? []) as DiscoverableWorkOrder[];
  const lineRows = (lines ?? []) as DiscoverableLine[];
  const inspectionItems = (inspectionItemsResult.data ?? []) as InspectionItemRow[];
  const inspectionPhotos = (inspectionPhotosResult.data ?? []) as InspectionPhotoRow[];
  const vehicleMedia = (vehicleMediaResult.data ?? []) as VehicleMediaRow[];

  const opportunities: ContentOpportunity[] = [];

  for (const workOrder of workOrderRows) {
    const relatedLines = lineRows.filter((line) => line.work_order_id === workOrder.id);
    const vehicle = vehicleLabel(workOrder);

    const completedRepair = relatedLines.find(
      (line) =>
        line.status === "completed" &&
        (line.job_type === "repair" || line.job_type === "maintenance"),
    );

    if (completedRepair) {
      opportunities.push({
        sourceType: "repair_story",
        workOrderId: workOrder.id,
        sourceId: completedRepair.id,
        title: completedRepair.description ?? `Repair completed on ${vehicle}`,
        contentType: "repair_story",
        hook:
          completedRepair.cause && completedRepair.correction
            ? `${vehicle} came in with ${completedRepair.cause.toLowerCase()} — here’s how we fixed it.`
            : `Here’s how this ${vehicle} repair moved through the shop.`,
        reason: "Completed repair line found",
        visualUrls: [],
      });
    }

    const mechanicTip = relatedLines.find(
      (line) =>
        typeof line.cause === "string" &&
        line.cause.length > 0 &&
        typeof line.correction === "string" &&
        line.correction.length > 0,
    );

    if (mechanicTip) {
      opportunities.push({
        sourceType: "mechanic_tip",
        workOrderId: workOrder.id,
        sourceId: mechanicTip.id,
        title: mechanicTip.description ?? `Mechanic tip from ${vehicle}`,
        contentType: "educational_tip",
        hook: `A quick mechanic tip from this ${vehicle} job: what caused it, and what fixed it.`,
        reason: "Cause/correction pair found",
        visualUrls: [],
      });
    }

    const inspectionFinding = inspectionItems.find(
      (item) =>
        typeof item.status === "string" &&
        ["fail", "failed", "warning", "recommended"].includes(item.status.toLowerCase()),
    );

    if (inspectionFinding) {
      opportunities.push({
        sourceType: "inspection_item",
        workOrderId: workOrder.id,
        sourceId: inspectionFinding.id,
        title: getInspectionItemLabel(inspectionFinding),
        contentType: "inspection_highlight",
        hook: `We found this during an inspection on a ${vehicle}.`,
        reason: "Inspection item with fail/warning/recommended status found",
        visualUrls: [],
      });
    }

    const photoUrls = inspectionPhotos
      .map(getPhotoUrl)
      .filter((url): url is string => typeof url === "string" && url.length > 0)
      .slice(0, 2);

    if (photoUrls.length > 0) {
      opportunities.push({
        sourceType: "inspection_photo",
        workOrderId: workOrder.id,
        sourceId: inspectionPhotos[0]?.id ?? workOrder.id,
        title: `Before/after candidate for ${vehicle}`,
        contentType: "before_after",
        hook: `This ${vehicle} looked very different before we were done.`,
        reason: "Inspection photos found",
        visualUrls: photoUrls,
      });
    }

    const mediaUrls = vehicleMedia
      .map(getVehicleMediaUrl)
      .filter((url): url is string => typeof url === "string" && url.length > 0)
      .slice(0, 3);

    if (mediaUrls.length > 0) {
      opportunities.push({
        sourceType: "vehicle_media",
        workOrderId: workOrder.id,
        sourceId: vehicleMedia[0]?.id ?? workOrder.id,
        title: `Walkaround video for ${vehicle}`,
        contentType: "workflow_demo",
        hook: `Take a quick walk around this ${vehicle} in the shop.`,
        reason: "Vehicle media found",
        visualUrls: mediaUrls,
      });
    }

    if (
      !completedRepair &&
      !mechanicTip &&
      !inspectionFinding &&
      photoUrls.length === 0 &&
      mediaUrls.length === 0
    ) {
      opportunities.push({
        sourceType: "workflow_demo",
        workOrderId: workOrder.id,
        sourceId: workOrder.id,
        title: `${vehicle} workflow demo`,
        contentType: "workflow_demo",
        hook: `See how this ${vehicle} moved through the shop without the usual chaos.`,
        reason: "Fallback workflow opportunity",
        visualUrls: [],
      });
    }
  }

  return opportunities.slice(0, 20);
}
