import type { ContentOpportunity } from "../discovery/discoverContent"
import type { StorySource, StorySourceKind } from "./types"

function mapKind(opportunity: ContentOpportunity): StorySourceKind {
  switch (opportunity.contentType) {
    case "inspection_highlight":
      return "inspection_completed"
    case "before_after":
      return "before_after"
    case "repair_story":
      return "repair_completed"
    case "educational_tip":
      return "educational_insight"
    case "workflow_demo":
    default:
      return "manual_upload"
  }
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((v) => (v ?? "").trim()).filter(Boolean)))
}

export function storySourceFromOpportunity(
  shopId: string,
  opportunity: ContentOpportunity,
): StorySource {
  return {
    id: `opportunity:${opportunity.sourceId}`,
    shopId,
    title: opportunity.title,
    description: opportunity.reason,
    kind: mapKind(opportunity),
    origin: "future_operational_event",
    generationMode: "assisted",
    occurredAt: null,
    vehicleLabel: null,
    customerLabel: null,
    technicianLabel: null,
    tags: uniqueStrings([
      opportunity.contentType,
      opportunity.sourceType,
      opportunity.workOrderId ? "work_order" : null,
    ]),
    assets: opportunity.visualUrls.map((url, index) => ({
      id: `asset:${opportunity.sourceId}:${index + 1}`,
      assetType: "photo",
      url,
      sortOrder: index,
      metadata: {
        imported_from: "discoverContent",
      },
    })),
    refs: [
      {
        type: opportunity.workOrderId ? "future_work_order" : "content_piece",
        id: opportunity.workOrderId ?? opportunity.sourceId,
      },
    ],
    notes: [opportunity.reason],
    facts: {
      hook: opportunity.hook,
      contentType: opportunity.contentType,
      sourceType: opportunity.sourceType,
    },
    metadata: {
      sourceId: opportunity.sourceId,
      workOrderId: opportunity.workOrderId,
      hook: opportunity.hook,
    },
  }
}
