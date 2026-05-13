import type { OperatorIntent, OperatorMemoryRecord, WorkspaceContinuation } from "@/features/shopreel/operator-memory/models";

export type OperatorMemoryAggregate = {
  activeCampaignIds: string[];
  unresolvedApprovals: OperatorMemoryRecord[];
  pendingRenders: OperatorMemoryRecord[];
  unfinishedDrafts: OperatorMemoryRecord[];
  recentUploads: OperatorMemoryRecord[];
  recentOperatorFocus: OperatorIntent;
  stalledEntities: OperatorMemoryRecord[];
  creatorPatterns: Record<string, unknown>;
  continuitySummary: string;
};

const INTENT_PRIORITY: OperatorIntent[] = ["approving", "rendering", "editing", "reviewing", "publishing", "uploading", "ideating"];

export function aggregateOperatorMemory(records: OperatorMemoryRecord[]): OperatorMemoryAggregate {
  const activeCampaignIds = records
    .filter((r) => r.memoryKind === "active_campaign")
    .map((r) => String(r.payload.campaignId ?? ""))
    .filter(Boolean);

  const unresolvedApprovals = records.filter((r) => r.memoryKind === "pending_approval" && r.unresolved);
  const pendingRenders = records.filter((r) => r.memoryKind === "pending_render" && r.unresolved);
  const unfinishedDrafts = records.filter((r) => r.memoryKind === "unfinished_draft" && r.unresolved);
  const recentUploads = records.filter((r) => r.memoryKind === "recent_upload").slice(0, 5);
  const stalledEntities = records.filter((r) => r.memoryKind === "stalled_entity" && r.unresolved);

  const declaredIntents = records
    .filter((r) => r.memoryKind === "operator_focus")
    .map((r) => r.payload.intent)
    .filter((v): v is OperatorIntent => typeof v === "string" && INTENT_PRIORITY.includes(v as OperatorIntent));

  const recentOperatorFocus = INTENT_PRIORITY.find((intent) => declaredIntents.includes(intent)) ?? "ideating";

  const creatorPatterns = records
    .filter((r) => r.memoryKind === "creator_pattern")
    .reduce<Record<string, unknown>>((acc, record) => ({ ...acc, ...record.payload }), {});

  return {
    activeCampaignIds,
    unresolvedApprovals,
    pendingRenders,
    unfinishedDrafts,
    recentUploads,
    recentOperatorFocus,
    stalledEntities,
    creatorPatterns,
    continuitySummary: buildContinuitySummary({ unresolvedApprovals, pendingRenders, unfinishedDrafts, stalledEntities, activeCampaignIds }),
  };
}

function buildContinuitySummary(input: {
  unresolvedApprovals: OperatorMemoryRecord[];
  pendingRenders: OperatorMemoryRecord[];
  unfinishedDrafts: OperatorMemoryRecord[];
  stalledEntities: OperatorMemoryRecord[];
  activeCampaignIds: string[];
}): string {
  return `Active campaigns: ${input.activeCampaignIds.length}. Pending approvals: ${input.unresolvedApprovals.length}. Pending renders: ${input.pendingRenders.length}. Unfinished drafts: ${input.unfinishedDrafts.length}. Stalled entities: ${input.stalledEntities.length}.`;
}

export function deriveWorkspaceContinuation(records: OperatorMemoryRecord[]): WorkspaceContinuation {
  const aggregate = aggregateOperatorMemory(records);
  const recentlyActiveEntity = records
    .map((r) => ({ updatedAt: r.updatedAt, kind: String(r.payload.entityKind ?? ""), id: String(r.payload.entityId ?? "") }))
    .filter((r) => r.kind.length > 0 && r.id.length > 0)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;

  const likelyNextStep =
    aggregate.unresolvedApprovals.length > 0 ? "Resolve pending approvals" :
    aggregate.pendingRenders.length > 0 ? "Advance pending render queue" :
    aggregate.unfinishedDrafts.length > 0 ? "Complete unfinished drafts" :
    "Continue active campaign";

  return {
    focusIntent: aggregate.recentOperatorFocus,
    unresolvedMemoryKeys: records.filter((r) => r.unresolved).map((r) => r.memoryKey),
    recentlyActiveEntity,
    pendingApprovalCount: aggregate.unresolvedApprovals.length,
    likelyNextStep,
    continuitySummary: aggregate.continuitySummary,
  };
}
