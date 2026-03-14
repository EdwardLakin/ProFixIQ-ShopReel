import { createAdminClient } from "@/lib/supabase/server";
import {
  discoverContent,
  type ContentOpportunity,
} from "@/features/shopreel/discovery/discoverContent";
import { detectViralMoments } from "@/features/shopreel/moments/detectViralMoments";
import { generateHooks } from "@/features/shopreel/hooks/generateHooks";
import { updateMarketingMemory } from "@/features/shopreel/memory/updateMarketingMemory";
import { updateLearningSignals } from "@/features/shopreel/learning/updateLearningSignals";
import { getShopReelSettings } from "@/features/shopreel/settings/getShopReelSettings";

type SchedulerCalendarItem = {
  day: number;
  scheduledFor: string;
  contentPieceId: string;
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
  readiness: {
    canPublish: boolean;
    canAutopilot: boolean;
    missing: string[];
  };
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

function defaultCta(contentType: string, fallback: string | null): string {
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }

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

function buildScheduledFor(dayOffset: number): string {
  const scheduled = new Date();
  scheduled.setUTCDate(scheduled.getUTCDate() + dayOffset);
  scheduled.setUTCHours(16, 0, 0, 0);
  return scheduled.toISOString();
}

function uniquePlatformTargets(input: string[]): string[] {
  return [...new Set(input.filter((value) => typeof value === "string" && value.length > 0))];
}

export async function runShopReelAutopilot(
  shopId: string,
): Promise<SchedulerResult> {
  const supabase = createAdminClient();
  const settingsBundle = await getShopReelSettings(shopId);

  const discovered = await discoverContent(shopId);
  const moments = await detectViralMoments(shopId);

  const ranked = [...discovered]
    .sort((a, b) => rankOpportunity(b) - rankOpportunity(a))
    .slice(0, 7);

  const startDate = new Date().toISOString();
  const endDate = new Date(Date.now() + 7 * 86400000).toISOString();

  const calendarName = `AI Autopilot Calendar ${new Date().toLocaleDateString()}`;

  const { data: insertedCalendarData, error: calendarError } = await supabase
    .from("content_calendars")
    .insert({
      tenant_shop_id: shopId,
      source_shop_id: shopId,
      source_system: "shopreel",
      name: calendarName,
      description: "7-day AI-generated ShopReel content calendar.",
      settings: {
        generated_by: "runShopReelAutopilot",
        readiness_missing: settingsBundle.readiness.missing,
      },
    })
    .select("id")
    .single();

  const insertedCalendar = insertedCalendarData as { id: string } | null;

  if (calendarError || !insertedCalendar) {
    throw new Error(calendarError?.message ?? "Failed to create content calendar");
  }

  const enabledTargets = uniquePlatformTargets(settingsBundle.settings?.enabled_platforms ?? []);
  const defaultCtaValue = settingsBundle.settings?.default_cta ?? null;

  const items: SchedulerCalendarItem[] = [];

  for (let index = 0; index < ranked.length; index += 1) {
    const opportunity = ranked[index];
    const hookOptions = await generateHooks(opportunity.contentType);
    const scheduledFor = buildScheduledFor(index);
    const resolvedCta = defaultCta(opportunity.contentType, defaultCtaValue);

    const { data: contentPieceData, error: contentPieceError } = await supabase
      .from("content_pieces")
      .insert({
        tenant_shop_id: shopId,
        source_shop_id: shopId,
        source_system: "shopreel",
        source_work_order_id: opportunity.workOrderId,
        title: opportunity.title,
        content_type: opportunity.contentType,
        hook: opportunity.hook,
        caption: opportunity.hook,
        cta: resolvedCta,
        script_text: null,
        voiceover_text: null,
        platform_targets: enabledTargets,
        status: "draft",
        metadata: {
          planned_for_calendar: true,
          scheduled_for: scheduledFor,
          source_type: opportunity.sourceType,
          source_id: opportunity.sourceId,
          reason: opportunity.reason,
          visual_urls: opportunity.visualUrls,
          hook_options: hookOptions,
        },
      })
      .select("id")
      .single();

    const contentPiece = contentPieceData as { id: string } | null;

    if (contentPieceError || !contentPiece) {
      throw new Error(contentPieceError?.message ?? "Failed to create content piece");
    }

    const { error: calendarItemError } = await supabase
      .from("content_calendar_items")
      .insert({
        calendar_id: insertedCalendar.id,
        content_piece_id: contentPiece.id,
        scheduled_for: scheduledFor,
        tenant_shop_id: shopId,
        source_shop_id: shopId,
        source_system: "shopreel",
        status: "planned",
        metadata: {
          source_type: opportunity.sourceType,
          source_id: opportunity.sourceId,
          reason: opportunity.reason,
          visual_urls: opportunity.visualUrls,
          work_order_id: opportunity.workOrderId,
          day: index + 1,
          hook_options: hookOptions,
        },
      });

    if (calendarItemError) {
      throw new Error(calendarItemError.message);
    }

    items.push({
      day: index + 1,
      scheduledFor,
      contentPieceId: contentPiece.id,
      title: opportunity.title,
      contentType: opportunity.contentType,
      hook: opportunity.hook,
      cta: resolvedCta,
      sourceType: opportunity.sourceType,
      sourceId: opportunity.sourceId,
      workOrderId: opportunity.workOrderId,
      visualUrls: opportunity.visualUrls,
      reason: opportunity.reason,
      hookOptions,
    });
  }

  const memory = await updateMarketingMemory(shopId);
  const signals = await updateLearningSignals(shopId);

  return {
    ok: true,
    shopId,
    readiness: {
      canPublish: settingsBundle.readiness.canPublish,
      canAutopilot: settingsBundle.readiness.canAutopilot,
      missing: settingsBundle.readiness.missing,
    },
    calendar: {
      calendarId: insertedCalendar.id,
      startDate,
      endDate,
      itemsCreated: items.length,
      items,
    },
    memory,
    signals,
    moments,
  };
}
