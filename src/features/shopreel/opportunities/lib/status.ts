export const OPPORTUNITY_STATUSES = [
  "pending",
  "ready",
  "generated",
  "dismissed",
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const ACTIVE_OPPORTUNITY_STATUSES: OpportunityStatus[] = ["pending", "ready"];

export function isOpportunityStatus(value: string): value is OpportunityStatus {
  return (OPPORTUNITY_STATUSES as readonly string[]).includes(value);
}

export function normalizeOpportunityStatus(
  value: unknown,
  fallback: OpportunityStatus = "ready",
): OpportunityStatus {
  if (typeof value !== "string") return fallback;
  const next = value.trim();
  return isOpportunityStatus(next) ? next : fallback;
}

export function getOpportunityStatusesForTab(tab: string): OpportunityStatus[] {
  if (tab === "dismissed") return ["dismissed"];
  if (tab === "generated") return ["generated"];
  return ACTIVE_OPPORTUNITY_STATUSES;
}
