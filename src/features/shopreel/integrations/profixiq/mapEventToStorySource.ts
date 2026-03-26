import crypto from "crypto";
import type {
  StorySource,
  StorySourceAsset,
  StorySourceKind,
} from "@/features/shopreel/story-sources/types";
import type { ProFixIQIngestPayload } from "./types";

function mapEventTypeToKind(
  eventType: ProFixIQIngestPayload["eventType"]
): StorySourceKind {
  switch (eventType) {
    case "inspection.completed":
      return "inspection_completed";
    case "inspection.finding.flagged":
      return "educational_insight";
    case "inspection.media.captured":
      return "service_highlight";
    case "workorder.approved":
      return "service_highlight";
    case "workorder.completed":
      return "repair_completed";
    case "media.before_after.added":
      return "before_after";
    default:
      return "service_highlight";
  }
}

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function firstServiceLabel(payload: ProFixIQIngestPayload): string | null {
  for (const service of payload.storyData.services ?? []) {
    const label = cleanString(service.label);
    if (label) return label;
  }
  return null;
}

function firstFindingLabel(payload: ProFixIQIngestPayload): string | null {
  for (const finding of payload.storyData.findings ?? []) {
    const label = cleanString(finding.label);
    if (label) return label;
  }
  return null;
}

function buildTags(payload: ProFixIQIngestPayload) {
  const tags = new Set<string>();

  tags.add("profixiq");
  tags.add(payload.eventType);

  if (payload.subject.vehicleLabel) {
    tags.add("vehicle");
  }

  if (payload.storyData.media?.length) {
    tags.add("media");
  }

  if (payload.storyData.approvalStatus) {
    tags.add(payload.storyData.approvalStatus);
  }

  return Array.from(tags);
}

function buildAssets(payload: ProFixIQIngestPayload): StorySourceAsset[] {
  return (payload.storyData.media ?? []).map((media, index) => ({
    id: crypto.randomUUID(),
    assetType: media.kind === "video" ? "video" : "photo",
    url: media.url,
    title: media.title ?? buildTitle(payload),
    caption: buildDescription(payload),
    note: payload.storyData.technicianSummary ?? null,
    takenAt: media.takenAt ?? payload.occurredAt,
    sortOrder: index,
    metadata: {
      role: media.role ?? null,
      source_system: "profixiq",
      source_shop_id: payload.source.shopId,
      source_work_order_id: payload.subject.workOrderId ?? null,
      source_inspection_id: payload.subject.inspectionId ?? null,
      source_vehicle_id: payload.subject.vehicleId ?? null,
    },
  }));
}

function buildNotes(payload: ProFixIQIngestPayload) {
  const notes = new Set<string>();

  if (payload.storyData.summary) {
    notes.add(payload.storyData.summary);
  }

  if (payload.storyData.technicianSummary) {
    notes.add(payload.storyData.technicianSummary);
  }

  for (const finding of payload.storyData.findings ?? []) {
    const label = cleanString(finding.label);
    if (!label) continue;

    notes.add(
      `${finding.status ? `${finding.status.toUpperCase()}: ` : ""}${label}`
    );
  }

  for (const service of payload.storyData.services ?? []) {
    const label = cleanString(service.label);
    if (!label) continue;

    notes.add(`Service: ${label}`);
  }

  return Array.from(notes);
}

function buildTitle(payload: ProFixIQIngestPayload): string {
  const explicitHeadline = cleanString(payload.storyData.headline);
  const vehicle = cleanString(payload.subject.vehicleLabel);
  const service = firstServiceLabel(payload);
  const finding = firstFindingLabel(payload);

  const looksLikeTestHeadline =
    explicitHeadline?.toLowerCase().includes("test") ?? false;

  switch (payload.eventType) {
    case "workorder.completed":
      if (service && vehicle) return `${service} completed on ${vehicle}`;
      if (finding && vehicle) return `${finding} repaired on ${vehicle}`;
      if (service) return `${service} completed`;
      if (vehicle) return `Repair completed on ${vehicle}`;
      if (explicitHeadline && !looksLikeTestHeadline) return explicitHeadline;
      return "Repair completed";

    case "workorder.approved":
      if (service && vehicle) return `${service} approved for ${vehicle}`;
      if (service) return `${service} approved`;
      if (vehicle) return `Repair approved for ${vehicle}`;
      if (explicitHeadline && !looksLikeTestHeadline) return explicitHeadline;
      return "Repair approved";

    case "inspection.finding.flagged":
      if (finding && vehicle) return `${finding} found on ${vehicle}`;
      if (finding) return `Inspection finding: ${finding}`;
      if (vehicle) return `Inspection finding flagged on ${vehicle}`;
      if (explicitHeadline && !looksLikeTestHeadline) return explicitHeadline;
      return "Inspection finding flagged";

    case "inspection.media.captured":
      if (vehicle) return `Service media captured for ${vehicle}`;
      if (explicitHeadline && !looksLikeTestHeadline) return explicitHeadline;
      return "Service media captured";

    case "inspection.completed":
      if (vehicle) return `Inspection completed for ${vehicle}`;
      if (explicitHeadline && !looksLikeTestHeadline) return explicitHeadline;
      return "Inspection completed";

    case "media.before_after.added":
      if (vehicle) return `Before and after added for ${vehicle}`;
      if (explicitHeadline && !looksLikeTestHeadline) return explicitHeadline;
      return "Before and after story";

    default:
      return explicitHeadline ?? payload.eventType;
  }
}

function buildDescription(payload: ProFixIQIngestPayload): string | null {
  const summary = cleanString(payload.storyData.summary);
  const technicianSummary = cleanString(payload.storyData.technicianSummary);

  const findings = (payload.storyData.findings ?? [])
    .map((finding) => {
      const label = cleanString(finding.label);
      if (!label) return null;
      return `${finding.status ? `${finding.status.toUpperCase()}: ` : ""}${label}`;
    })
    .filter((value): value is string => Boolean(value));

  const services = (payload.storyData.services ?? [])
    .map((service) => cleanString(service.label))
    .filter((value): value is string => Boolean(value));

  const looksLikeTestSummary =
    summary?.toLowerCase().includes("test event") ?? false;

  if (summary && !looksLikeTestSummary) {
    return summary;
  }

  if (technicianSummary) {
    return technicianSummary;
  }

  if (findings.length > 0) {
    return findings.slice(0, 3).join(" • ");
  }

  if (services.length > 0) {
    return `Services included: ${services.slice(0, 3).join(", ")}`;
  }

  return null;
}

export function mapEventToStorySource(args: {
  tenantShopId: string;
  payload: ProFixIQIngestPayload;
}): StorySource {
  const { tenantShopId, payload } = args;

  return {
    id: crypto.randomUUID(),
    shopId: tenantShopId,
    title: buildTitle(payload),
    description: buildDescription(payload),
    kind: mapEventTypeToKind(payload.eventType),
    origin: "shop_data",
    generationMode: "automatic",
    occurredAt: payload.occurredAt,
    startedAt: null,
    endedAt: null,
    projectId: null,
    projectName: null,
    vehicleLabel: payload.subject.vehicleLabel ?? null,
    customerLabel: payload.subject.customerLabel ?? null,
    technicianLabel: null,
    tags: buildTags(payload),
    notes: buildNotes(payload),
    facts: {
      eventId: payload.eventId,
      eventType: payload.eventType,
      approvalStatus: payload.storyData.approvalStatus ?? null,
      findingCount: payload.storyData.findings?.length ?? 0,
      serviceCount: payload.storyData.services?.length ?? 0,
      mediaCount: payload.storyData.media?.length ?? 0,
    },
    metadata: {
      source_system: "profixiq",
      source_shop_id: payload.source.shopId,
      source_work_order_id: payload.subject.workOrderId ?? null,
      source_inspection_id: payload.subject.inspectionId ?? null,
      source_vehicle_id: payload.subject.vehicleId ?? null,
      source_event_id: payload.eventId,
      source_event_type: payload.eventType,
      privacy: payload.privacy,
      source_refs: {
        source_shop_id: payload.source.shopId,
        source_vehicle_id: payload.subject.vehicleId ?? null,
        source_work_order_id: payload.subject.workOrderId ?? null,
        source_inspection_id: payload.subject.inspectionId ?? null,
        source_system: "profixiq",
      },
    },
    assets: buildAssets(payload),
    refs: [],
  };
}