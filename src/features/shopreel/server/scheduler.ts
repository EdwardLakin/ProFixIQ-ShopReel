import { createAdminClient } from "@/lib/supabase/server";
import { generateContentCalendar } from "@/features/shopreel/calendar/generateContentCalendar";
import { updateMarketingMemory } from "@/features/shopreel/memory/updateMarketingMemory";

type SchedulerResult = {
  ok: true;
  shopId: string;
  calendar?: {
    calendarId: string;
    startDate: string;
    endDate: string;
    itemsCreated: number;
  };
  memory?: unknown;
};

export async function runShopReelAutopilot(
  shopId: string,
): Promise<SchedulerResult> {
  const supabase = createAdminClient();

  const { data: existingCalendar } = await supabase
    .from("content_calendars")
    .select("id, start_date, end_date")
    .eq("shop_id", shopId)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let calendarResult:
    | {
        calendarId: string;
        startDate: string;
        endDate: string;
        itemsCreated: number;
      }
    | undefined;

  if (!existingCalendar) {
    calendarResult = await generateContentCalendar(shopId);
  } else {
    calendarResult = {
      calendarId: existingCalendar.id,
      startDate: existingCalendar.start_date,
      endDate: existingCalendar.end_date,
      itemsCreated: 0,
    };
  }

  const memoryResult = await updateMarketingMemory(shopId);

  return {
    ok: true,
    shopId,
    calendar: calendarResult,
    memory: memoryResult,
  };
}