import { discoverContent } from "../discovery/discoverContent";
import type { StorySourceCandidate } from "./types";

export async function discoverStorySourceCandidates(
  shopId: string,
): Promise<StorySourceCandidate[]> {
  const opportunities = await discoverContent(shopId);

  return opportunities.map((opportunity) => ({
    title: opportunity.title,
    kind:
      opportunity.contentType === "repair_story"
        ? "repair_completed"
        : opportunity.contentType === "inspection_highlight"
          ? "inspection_completed"
          : opportunity.contentType === "before_after"
            ? "before_after"
            : opportunity.contentType === "educational_tip"
              ? "educational_insight"
              : "manual_upload",
    confidence: 0.8,
    reason: opportunity.reason,
    tags: [opportunity.contentType, opportunity.sourceType].filter(Boolean),
    metadata: {
      sourceId: opportunity.sourceId,
      workOrderId: opportunity.workOrderId,
      hook: opportunity.hook,
      visualUrlCount: opportunity.visualUrls.length,
    },
  }));
}
