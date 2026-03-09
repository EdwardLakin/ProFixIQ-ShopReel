import { createAdminClient } from "@/lib/supabase/server";
import { discoverContent, type ContentOpportunity } from "@/features/shopreel/discovery/discoverContent";
import { detectViralMoments } from "@/features/shopreel/moments/detectViralMoments";
import { generateHooks } from "@/features/shopreel/hooks/generateHooks";
import { updateMarketingMemory } from "@/features/shopreel/memory/updateMarketingMemory";
import { updateLearningSignals } from "@/features/shopreel/learning/updateLearningSignals";
import { getShopReelSettings } from "@/features/shopreel/settings/getShopReelSettings";

type SchedulerCalendarItem = {
  day: number;
  title: string;
  contentType: string;
  hook: string;
  cta: string;
  sourceType: string;
  sourceId: string;
  workOrderId: string | null;
  visualUrls: string[];
  reason: string;
  hookOptions: unknown;
};

type SchedulerResult = {
  ok: true;
  shopId: string;
  calendar: {
    calendarId: string;
    startDate: string;
    endDate: string;
    itemsCreated: number;
    items: SchedulerCalendarItem[];
  };
  memory: unknown;
  signals: unknown;
  moments: unknown;
};

function defaultCta(contentType: string): string {
  switch (contentType) {
    case "repair_story":
      return "Follow for more real repair stories.";
    case "inspection_highlight":
      return "Follow for more real inspection findings.";
    case "before_after":
      return "Follow to see more before-and-after transformations.";
    case "educational_tip":
      return "Follow for more mechanic tips and repair advice.";
    default:
      return "Follow for more real repair and inspection content.";
  }
}

function rankOpportunity(opportunity: ContentOpportunity): number {
  switch (opportunity.contentType) {
    case "before_after":
      return 100;
    case "repair_story":
      return 90;
    case "inspection_highlight":
      return 80;
    case "educational_tip":
      return 70;
    default:
      return 60;
  }
}

export async function runShopReelAutopilot(
  shopId: string,
): Promise<SchedulerResult> {
  const supabase = createAdminClient();
  const settingsBundle = await getShopReelSettings(shopId);

  if (!settingsBundle.readiness.canPublish) {
    throw new Error(
      `ShopReel launch settings incomplete: ${settingsBundle.readiness.missing.join(", ")}`,
    );
  }

  const discovered = await discoverContent(shopId);
  const moments = await detectViralMoments(shopId);

  const ranked = [...discovered]
    .sort((a, b) => rankOpportunity(b) - rankOpportunity(a))
    .slice(0, 7);

  const items: SchedulerCalendarItem[] = await Promise.all(
    ranked.map(async (opportunity, index) => {
      const hookOptions = await generateHooks(opportunity.contentType);

      return {
        day: index + 1,
        title: opportunity.title,
        contentType: opportunity.contentType,
        hook: opportunity.hook,
        cta: defaultCta(opportunity.contentType),
        sourceType: opportunity.sourceType,
        sourceId: opportunity.sourceId,
        workOrderId: opportunity.workOrderId,
        visualUrls: opportunity.visualUrls,
        reason: opportunity.reason,
        hookOptions,
      };
    }),
  );

  const { data: insertedCalendar, error: calendarError } = await supabase
    .from("content_calendars")
    .insert({
      shop_id: shopId,
      title: "AI Autopilot Content Calendar",
      status: "draft",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    } as never)
    .select("id, start_date, end_date")
    .single();

  if (calendarError || !insertedCalendar) {
    throw new Error(calendarError?.message ?? "Failed to create content calendar");
  }

  const calendarItemsPayload = items.map((item, index) => {
  const publishDate = new Date(Date.now() + index * 86400000)
    .toISOString()
    .slice(0, 10);

  return {
    calendar_id: insertedCalendar.id,
    shop_id: shopId,
    publish_date: publishDate,
    content_type: item.contentType,
    source_work_order_id: item.workOrderId,
    title: item.title,
    hook: item.hook,
    cta: item.cta,
    status: "planned",
  };
});

  const { error: calendarItemsError } = await supabase
    .from("content_calendar_items")
    .insert(calendarItemsPayload as never);

  if (calendarItemsError) {
    throw new Error(calendarItemsError.message);
  }

  const memory = await updateMarketingMemory(shopId);
  const signals = await updateLearningSignals(shopId);

  return {
    ok: true,
    shopId,
    calendar: {
      calendarId: insertedCalendar.id,
      startDate: insertedCalendar.start_date,
      endDate: insertedCalendar.end_date,
      itemsCreated: items.length,
      items,
    },
    memory,
    signals,
    moments,
  };
}
