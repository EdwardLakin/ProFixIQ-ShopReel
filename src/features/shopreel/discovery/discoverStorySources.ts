import { createAdminClient } from "@/lib/supabase/server";

type DiscoverResult = {
  sourcesCreated: number;
};

export async function discoverStorySources(): Promise<DiscoverResult> {
  const supabase = createAdminClient();

  let created = 0;

  /*
   * --------------------------------------------------------
   * 1 — Discover inspections
   * --------------------------------------------------------
   */

  const { data: inspections } = await supabase
    .from("inspections")
    .select("id, vehicle_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (inspections?.length) {
    for (const inspection of inspections) {
      const sourceId = `inspection:${inspection.id}`;

      const { error } = await supabase.from("story_sources").upsert(
        {
          id: sourceId,
          kind: "inspection_completed",
          origin: "shop_data",
          title: "Inspection completed",
          description: "Vehicle inspection completed",
          source_ref_id: inspection.id,
          created_at: inspection.created_at,
        },
        { onConflict: "id" }
      );

      if (!error) created++;
    }
  }

  /*
   * --------------------------------------------------------
   * 2 — Discover work orders
   * --------------------------------------------------------
   */

  const { data: workOrders } = await supabase
    .from("work_orders")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (workOrders?.length) {
    for (const wo of workOrders) {
      const sourceId = `workorder:${wo.id}`;

      const { error } = await supabase.from("story_sources").upsert(
        {
          id: sourceId,
          kind: "repair_completed",
          origin: "shop_data",
          title: "Repair completed",
          description: "Work order completed",
          source_ref_id: wo.id,
          created_at: wo.created_at,
        },
        { onConflict: "id" }
      );

      if (!error) created++;
    }
  }

  /*
   * --------------------------------------------------------
   * 3 — Discover uploaded media
   * --------------------------------------------------------
   */

  const { data: media } = await supabase
    .from("vehicle_media")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (media?.length) {
    for (const item of media) {
      const sourceId = `media:${item.id}`;

      const { error } = await supabase.from("story_sources").upsert(
        {
          id: sourceId,
          kind: "media_uploaded",
          origin: "shop_data",
          title: "Vehicle media uploaded",
          description: "Vehicle photo or video added",
          source_ref_id: item.id,
          created_at: item.created_at,
        },
        { onConflict: "id" }
      );

      if (!error) created++;
    }
  }

  return {
    sourcesCreated: created,
  };
}
