import type { RuntimeWorldEntryIntent, RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import { RUNTIME_WORLD_MAP } from "@/features/shopreel/ui/system/runtimeWorldMap";

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
export function resolveWorldFromEntityKind(kind: string | null | undefined): RuntimeWorldId {
  if (!kind) return "operations";
  if (["campaign"].includes(kind)) return "campaign";
  if (["opportunity"].includes(kind)) return "idea";
  if (["manual_asset"].includes(kind)) return "upload";
  if (["generation"].includes(kind)) return "generation";
  if (["review_item"].includes(kind)) return "review";
  if (["render_job"].includes(kind)) return "render";
  if (["publication"].includes(kind)) return "publish";
  if (["calendar_item"].includes(kind)) return "calendar";
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
