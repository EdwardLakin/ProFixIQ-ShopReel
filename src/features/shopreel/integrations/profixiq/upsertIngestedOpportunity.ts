import { createAdminClient } from "@/lib/supabase/server";

function scoreFromEventType(eventType: string, mediaCount: number) {
  const mediaBonus = mediaCount > 0 ? 15 : 0;

  switch (eventType) {
    case "inspection.media.captured":
      return 85 + mediaBonus;
    case "workorder.completed":
      return 82 + mediaBonus;
    case "inspection.finding.flagged":
      return 78 + mediaBonus;
    case "inspection.completed":
      return 70 + mediaBonus;
    case "workorder.approved":
      return 65 + mediaBonus;
    case "media.before_after.added":
      return 90 + mediaBonus;
    default:
      return 60 + mediaBonus;
  }
}

export async function upsertIngestedOpportunity(args: {
  tenantShopId: string;
  storySourceId: string;
  eventType: string;
  metadata: Record<string, unknown>;
  mediaCount: number;
}) {
  const supabase = createAdminClient();
  const score = scoreFromEventType(args.eventType, args.mediaCount);

  const { error } = await supabase
    .from("shopreel_content_opportunities")
    .upsert(
      {
        shop_id: args.tenantShopId,
        story_source_id: args.storySourceId,
        score,
        reason: `Imported from ProFixIQ: ${args.eventType}`,
        metadata: {
          ...args.metadata,
          ingest: {
            source_system: "profixiq",
            event_type: args.eventType,
          },
        },
        status: "ready",
      },
      {
        onConflict: "shop_id,story_source_id",
      }
    );

  if (error) {
    throw new Error(`Opportunity upsert failed: ${error.message}`);
  }

  return { score };
}
