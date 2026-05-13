import type { WorkspaceTimelineAggregate, WorkspaceTimelineEvent } from "@/features/shopreel/workspace-timeline/models";

export function aggregateWorkspaceTimeline(events: WorkspaceTimelineEvent[]): WorkspaceTimelineAggregate {
  const recentWorkspaceActivity = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);

  const campaignLineage = events.reduce<Record<string, WorkspaceTimelineEvent[]>>((acc, event) => {
    const campaignId = extractCampaignId(event);
    if (!campaignId) return acc;
    return { ...acc, [campaignId]: [...(acc[campaignId] ?? []), event] };
  }, {});

  const unresolvedProgression = events.filter((event) => event.unresolved);

  const entityRelationshipTracing = events.reduce<Record<string, string[]>>((acc, event) => {
    if (!event.entityId) return acc;
    const key = `${event.entityKind}:${event.entityId}`;
    const relation = extractRelatedEntityKey(event);
    if (!relation) return acc;
    return { ...acc, [key]: [...(acc[key] ?? []), relation] };
  }, {});

  return {
    recentWorkspaceActivity,
    campaignLineage,
    unresolvedProgression,
    entityRelationshipTracing,
  };
}

function extractCampaignId(event: WorkspaceTimelineEvent): string | null {
  if (typeof event.payload.campaignId === "string") return event.payload.campaignId;
  return event.entityKind === "campaign" && event.entityId ? event.entityId : null;
}

function extractRelatedEntityKey(event: WorkspaceTimelineEvent): string | null {
  const kind = event.payload.relatedEntityKind;
  const id = event.payload.relatedEntityId;
  if (typeof kind === "string" && typeof id === "string") return `${kind}:${id}`;
  return null;
}
