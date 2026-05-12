export type OperatorWorldKind =
  | "campaign"
  | "generation"
  | "content_piece"
  | "render_job"
  | "publication"
  | "manual_asset"
  | "opportunity"
  | "review_item"
  | "calendar_item";

export type OperatorWorldPriority = "critical" | "high" | "normal" | "low";

export type OperatorWorldCard = {
  id: string;
  kind: OperatorWorldKind;
  title: string;
  status: string;
  normalizedStatus: string;
  sourceLabel: string;
  stageLabel: string;
  actionLabel: string;
  priority: OperatorWorldPriority;
  updatedAt: string | null;
  createdAt: string | null;
  href: string;
};

const REVIEW_STATUS_RE = /(await|review|approval|needs_approval|pending_approval)/i;
const BLOCKED_STATUS_RE = /(block|fail|error|interrupted|rejected|canceled)/i;
const ACTIVE_STATUS_RE = /(draft|active|running|process|queue|render|publish|planning|progress)/i;
const COMPLETE_STATUS_RE = /(complete|completed|published|done|ready|archive)/i;

export function normalizeOperatorWorldStatus(kind: OperatorWorldKind, status: string | null | undefined): string {
  const base = (status ?? "unknown").trim().toLowerCase();
  if (!base) return "unknown";
  if (BLOCKED_STATUS_RE.test(base)) return "blocked";
  if (REVIEW_STATUS_RE.test(base)) return kind === "review_item" ? "awaiting_review" : "awaiting_approval";
  if (COMPLETE_STATUS_RE.test(base)) return "completed";
  if (ACTIVE_STATUS_RE.test(base)) return "in_progress";
  return base.replace(/\s+/g, "_");
}

export function getOperatorWorldHref(kind: OperatorWorldKind, id: string): string {
  switch (kind) {
    case "campaign":
      return `/shopreel/campaigns/${id}`;
    case "generation":
      return `/shopreel/generations/${id}`;
    case "content_piece":
      return `/shopreel/content/${id}`;
    case "render_job":
      return `/shopreel/video-creation/jobs/${id}`;
    case "publication":
      return "/shopreel/publish-center";
    case "manual_asset":
      return "/shopreel/upload";
    case "opportunity":
      return `/shopreel/opportunities/${id}`;
    case "review_item":
      return `/shopreel/review/${id}`;
    case "calendar_item":
      return "/shopreel/calendar";
    default:
      return "/shopreel";
  }
}

export function getOperatorWorldPriority(
  kind: OperatorWorldKind,
  normalizedStatus: string,
  updatedAt: string | null,
): OperatorWorldPriority {
  const ageMs = updatedAt ? Date.now() - new Date(updatedAt).getTime() : Number.POSITIVE_INFINITY;
  if (normalizedStatus === "blocked") return "critical";
  if (normalizedStatus.includes("review") || normalizedStatus.includes("approval")) return "high";
  if (kind === "render_job" && ageMs < 12 * 60 * 60 * 1000) return "high";
  if (normalizedStatus === "in_progress") return "normal";
  if (normalizedStatus === "completed") return "low";
  return "normal";
}

function priorityRank(priority: OperatorWorldPriority): number {
  if (priority === "critical") return 0;
  if (priority === "high") return 1;
  if (priority === "normal") return 2;
  return 3;
}

function timestampScore(card: OperatorWorldCard): number {
  const timestamp = card.updatedAt ?? card.createdAt;
  if (!timestamp) return 0;
  const parsed = new Date(timestamp).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortOperatorWorlds(worlds: OperatorWorldCard[]): OperatorWorldCard[] {
  return [...worlds].sort((a, b) => {
    const priorityDiff = priorityRank(a.priority) - priorityRank(b.priority);
    if (priorityDiff !== 0) return priorityDiff;

    const timeDiff = timestampScore(b) - timestampScore(a);
    if (timeDiff !== 0) return timeDiff;

    const aActive = a.normalizedStatus === "in_progress" ? 0 : 1;
    const bActive = b.normalizedStatus === "in_progress" ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;

    const aCompleted = a.normalizedStatus === "completed" ? 1 : 0;
    const bCompleted = b.normalizedStatus === "completed" ? 1 : 0;
    if (aCompleted !== bCompleted) return aCompleted - bCompleted;

    return a.title.localeCompare(b.title);
  });
}
