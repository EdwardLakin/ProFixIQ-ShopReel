import { createAdminClient } from "@/lib/supabase/server";

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

type WorkOrderVehicleRow = {
  vehicle_id: string | null;
  inspection_id: string | null;
};

export type ReelMediaSelection = {
  workOrderId: string;
  selectedUrls: string[];
  inspectionPhotoUrls: string[];
  vehicleMediaUrls: string[];
};

function photoUrl(row: InspectionPhotoRow): string | null {
  return (
    (typeof row.photo_url === "string" && row.photo_url.length > 0
      ? row.photo_url
      : null) ||
    (typeof row.url === "string" && row.url.length > 0 ? row.url : null)
  );
}

function mediaUrl(row: VehicleMediaRow): string | null {
  return (
    (typeof row.media_url === "string" && row.media_url.length > 0
      ? row.media_url
      : null) ||
    (typeof row.url === "string" && row.url.length > 0 ? row.url : null)
  );
}

export async function selectMediaForReel(
  workOrderId: string,
): Promise<ReelMediaSelection> {
  const supabase = createAdminClient();

  const { data: workOrder, error: workOrderError } = await supabase
    .from("work_orders")
    .select("vehicle_id, inspection_id")
    .eq("id", workOrderId)
    .maybeSingle();

  if (workOrderError) {
    throw new Error(workOrderError.message);
  }

  const row = (workOrder ?? {
    vehicle_id: null,
    inspection_id: null,
  }) as WorkOrderVehicleRow;

  let inspectionPhotoUrls: string[] = [];
  let vehicleMediaUrls: string[] = [];

  if (row.inspection_id) {
    const { data: inspectionPhotos, error: inspectionPhotosError } =
      await supabase
        .from("inspection_photos")
        .select("*")
        .eq("inspection_id", row.inspection_id)
        .order("created_at", { ascending: true })
        .limit(10);

    if (inspectionPhotosError) {
      throw new Error(inspectionPhotosError.message);
    }

    inspectionPhotoUrls = ((inspectionPhotos ?? []) as InspectionPhotoRow[])
      .map(photoUrl)
      .filter((value): value is string => Boolean(value));
  }

  if (row.vehicle_id) {
    const { data: vehicleMedia, error: vehicleMediaError } = await supabase
      .from("vehicle_media")
      .select("*")
      .eq("vehicle_id", row.vehicle_id)
      .order("created_at", { ascending: true })
      .limit(10);

    if (vehicleMediaError) {
      throw new Error(vehicleMediaError.message);
    }

    vehicleMediaUrls = ((vehicleMedia ?? []) as VehicleMediaRow[])
      .map(mediaUrl)
      .filter((value): value is string => Boolean(value));
  }

  const selectedUrls = [...inspectionPhotoUrls, ...vehicleMediaUrls].slice(0, 4);

  return {
    workOrderId,
    selectedUrls,
    inspectionPhotoUrls,
    vehicleMediaUrls,
  };
}
