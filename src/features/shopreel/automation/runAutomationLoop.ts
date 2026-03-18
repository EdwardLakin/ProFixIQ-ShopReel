import { createAdminClient } from "@/lib/supabase/server";
import { runShopReelAutopilot } from "./runShopReelAutopilot";
import { queueScheduledContent } from "@/features/shopreel/scheduler/queueScheduledContent";
import { processRenderJobs } from "@/features/shopreel/worker/processRenderJobs";
import { runPublishWorker } from "@/features/shopreel/publish/runPublishWorker";
import { runAnalyticsFeedbackLoop } from "@/features/shopreel/analytics/runAnalyticsFeedbackLoop";
import { refreshOpportunityScores } from "@/features/shopreel/opportunities/scoring/refreshOpportunityScores";
import { buildPrePublishRanking } from "@/features/shopreel/optimization/buildPrePublishRanking";

export async function runAutomationLoop(shopId: string) {
  const supabase = createAdminClient();

  const { count: activeCalendarCount, error: activeCalendarError } = await supabase
    .from("content_calendar_items")
    .select("*", { count: "exact", head: true })
    .eq("tenant_shop_id", shopId)
    .in("status", ["planned", "queued", "ready", "publishing"]);

  if (activeCalendarError) {
    throw new Error(activeCalendarError.message);
  }

  const shouldAutopilot = (activeCalendarCount ?? 0) < 3;

  const autopilot = shouldAutopilot
    ? await runShopReelAutopilot(shopId)
    : {
        ok: true,
        skipped: true,
        reason: "Existing calendar pipeline has enough queued work",
      };

  const preQueueRanking = await buildPrePublishRanking(shopId);
  const queued = await queueScheduledContent({ shopId });
  const rendered = await processRenderJobs();
  const published = await runPublishWorker();
  const analytics = await runAnalyticsFeedbackLoop(shopId);

  return {
    ok: true,
    shopId,
    autopilot,
    preQueueRanking: preQueueRanking.slice(0, 10),
    queued,
    rendered,
    published,
    analytics,
  };
}
