import crypto from "crypto";
import type { StorySource, StorySourceAsset, StorySourceKind } from "@/features/shopreel/story-sources/types";
import type { ProFixIQIngestPayload } from "./types";

function mapEventTypeToKind(eventType: ProFixIQIngestPayload["eventType"]): StorySourceKind {
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
    title: media.title ?? payload.storyData.headline ?? null,
    caption: payload.storyData.summary ?? null,
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
    notes.add(
      `${finding.status ? `${finding.status.toUpperCase()}: ` : ""}${finding.label}`
    );
  }

  for (const service of payload.storyData.services ?? []) {
    notes.add(`Service: ${service.label}`);
  }

  return Array.from(notes);
}

export function mapEventToStorySource(args: {
  tenantShopId: string;
  payload: ProFixIQIngestPayload;
}): StorySource {
  const { tenantShopId, payload } = args;

  return {
    id: crypto.randomUUID(),
    shopId: tenantShopId,
    title: payload.storyData.headline ?? payload.eventType,
    description: payload.storyData.summary ?? null,
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
