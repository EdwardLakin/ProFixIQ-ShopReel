import type { RuntimeWorldEntryIntent, RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import { RUNTIME_WORLD_MAP } from "@/features/shopreel/ui/system/runtimeWorldMap";

const RUNTIME_WORLD_IDS = new Set<RuntimeWorldId>(Object.keys(RUNTIME_WORLD_MAP) as RuntimeWorldId[]);
const RUNTIME_WORLD_ALIASES: Record<string, RuntimeWorldId> = {
  campaign: "campaign",
  campaigns: "campaign",
  campaign_detail: "campaign",
  campaigns_detail: "campaign",
  idea: "idea",
  ideas: "idea",
  opportunity: "idea",
  opportunities: "idea",
  upload: "upload",
  uploads: "upload",
  asset_library: "asset_library",
  library: "asset_library",
  generation: "generation",
  generations: "generation",
  video_creation: "video_creation",
  video: "video_creation",
  review: "review",
  render: "render",
  render_queue: "render",
  publish: "publish",
  calendar: "calendar",
  analytics: "analytics",
  automation: "automation",
  operations: "operations",
  operation: "operations",
  operator: "operations",
};

const PATH_WORLD: Array<{ re: RegExp; worldId: RuntimeWorldId }> = [
  { re: /^\/shopreel\/campaigns(\/|$)/, worldId: "campaign" }, { re: /^\/shopreel\/(opportunities|ideas)(\/|$)/, worldId: "idea" },
  { re: /^\/shopreel\/upload(\/|$)/, worldId: "upload" }, { re: /^\/shopreel\/library(\/|$)/, worldId: "asset_library" },
  { re: /^\/shopreel\/generations(\/|$)/, worldId: "generation" }, { re: /^\/shopreel\/video-creation(\/|$)/, worldId: "video_creation" },
  { re: /^\/shopreel\/review(\/|$)/, worldId: "review" }, { re: /^\/shopreel\/(render-queue|render-jobs)(\/|$)/, worldId: "render" },
  { re: /^\/shopreel\/(publish-center|publish-queue)(\/|$)/, worldId: "publish" }, { re: /^\/shopreel\/calendar(\/|$)/, worldId: "calendar" },
  { re: /^\/shopreel\/analytics(\/|$)/, worldId: "analytics" }, { re: /^\/shopreel\/automation(\/|$)/, worldId: "automation" },
  { re: /^\/shopreel\/(operations|operator)(\/|$)/, worldId: "operations" },
];

export function resolveWorldFromPath(pathname: string): RuntimeWorldId {
  return PATH_WORLD.find((m) => m.re.test(pathname))?.worldId ?? "operations";
}

export function resolveRuntimeWorldId(rawWorldKind: string | null | undefined, fallbackWorldId: RuntimeWorldId = "operations"): RuntimeWorldId {
  const normalized = (rawWorldKind ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized in RUNTIME_WORLD_ALIASES) return RUNTIME_WORLD_ALIASES[normalized];
  if (RUNTIME_WORLD_IDS.has(normalized as RuntimeWorldId)) return normalized as RuntimeWorldId;
  return fallbackWorldId;
}

export function resolveWorldFromEntityKind(kind: string | null | undefined): RuntimeWorldId {
  if (!kind) return "operations";
  if (["campaign"].includes(kind)) return resolveRuntimeWorldId("campaign");
  if (["opportunity"].includes(kind)) return resolveRuntimeWorldId("idea");
  if (["manual_asset"].includes(kind)) return resolveRuntimeWorldId("upload");
  if (["generation"].includes(kind)) return resolveRuntimeWorldId("generation");
  if (["review_item"].includes(kind)) return resolveRuntimeWorldId("review");
  if (["render_job"].includes(kind)) return resolveRuntimeWorldId("render");
  if (["publication"].includes(kind)) return resolveRuntimeWorldId("publish");
  if (["calendar_item"].includes(kind)) return resolveRuntimeWorldId("calendar");
  return "operations";
}
export function resolveWorldEntryForHref(href: string): RuntimeWorldId { return resolveWorldFromPath(href); }

export function buildWorldEntryIntent(input: Partial<RuntimeWorldEntryIntent> & { href: string }): RuntimeWorldEntryIntent {
  const worldId = input.worldId ?? resolveWorldEntryForHref(input.href);
  return {
    worldId,
    href: input.href,
    entityKind: input.entityKind ?? null,
    entityId: input.entityId ?? null,
    recommendedAction: input.recommendedAction ?? RUNTIME_WORLD_MAP[worldId].primaryActions[0]?.id ?? null,
    fallbackRoute: input.fallbackRoute ?? RUNTIME_WORLD_MAP[worldId].canonicalRoute,
    source: input.source ?? "direct",
  };
}
