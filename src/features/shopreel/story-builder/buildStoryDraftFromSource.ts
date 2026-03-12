import type { StoryDraft, StoryScene, StorySceneRole } from "./types"
import type { StorySource, StorySourceAsset } from "../story-sources"
import { DEFAULT_SCENE_SHAPE_BY_SOURCE_KIND } from "../story-sources"

function toTitleCase(value: string): string {
  return value
    .split("_")
    .map((part) => (part.length > 0 ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ")
}

function buildSceneTitle(role: StorySceneRole): string {
  switch (role) {
    case "cta":
      return "Call to action"
    case "why_it_matters":
      return "Why it matters"
    case "what_it_is":
      return "What it is"
    case "what_we_do":
      return "What we do"
    case "start_of_day":
      return "Start of day"
    case "end_of_day":
      return "End of day"
    case "current_state":
      return "Current state"
    default:
      return toTitleCase(role)
  }
}

function inferHook(source: StorySource): string {
  const factHook =
    typeof source.facts.hook === "string" && source.facts.hook.trim().length > 0
      ? source.facts.hook.trim()
      : null

  if (factHook) return factHook

  switch (source.kind) {
    case "before_after":
      return `${source.title} — here’s the transformation.`
    case "repair_completed":
      return `${source.title} — here’s what we fixed.`
    case "inspection_completed":
      return `${source.title} — here’s what we found.`
    case "educational_insight":
      return `${source.title} — here’s what to know.`
    case "daily_timeline":
      return `${source.title} — here’s how the day went.`
    default:
      return source.title
  }
}

function inferCaption(source: StorySource, hook: string): string {
  const noteLine = source.notes.find((note) => note.trim().length > 0)
  return [hook, noteLine].filter(Boolean).join(" ")
}

function inferCta(source: StorySource): string {
  switch (source.kind) {
    case "educational_insight":
    case "expert_tip":
      return "Follow for more practical tips."
    case "before_after":
    case "repair_completed":
    case "project_completed":
      return "Message us if you want results like this."
    case "inspection_completed":
      return "Book an inspection before it turns into a bigger repair."
    default:
      return "Reach out if you want help with a job like this."
  }
}

function assetToMedia(asset: StorySourceAsset) {
  return {
    contentAssetId: asset.contentAssetId ?? null,
    manualAssetId: asset.manualAssetId ?? null,
    url: asset.url ?? null,
    startSeconds: null,
    endSeconds: null,
    metadata: asset.metadata ?? {},
  }
}

function pickAssetsForRole(source: StorySource, role: StorySceneRole): StorySourceAsset[] {
  if (source.assets.length === 0) return []

  if (role === "hook") return source.assets.slice(0, 1)
  if (role === "before") return source.assets.slice(0, 1)
  if (role === "after") return source.assets.slice(-1)
  if (role === "result" || role === "cta") return source.assets.slice(-1)

  return source.assets.slice(0, Math.min(2, source.assets.length))
}

function buildOverlayText(
  source: StorySource,
  role: StorySceneRole,
  index: number,
  hook: string,
): string {
  if (role === "hook") return hook
  if (role === "cta") return inferCta(source)

  const note = source.notes[index]
  if (typeof note === "string" && note.trim().length > 0) {
    return note.trim()
  }

  return buildSceneTitle(role)
}

function buildVoiceoverText(
  source: StorySource,
  role: StorySceneRole,
  overlayText: string,
): string {
  if (role === "hook") {
    return overlayText
  }

  if (role === "cta") {
    return inferCta(source)
  }

  if (source.description && source.description.trim().length > 0) {
    return `${overlayText}. ${source.description.trim()}`
  }

  return overlayText
}

function buildScenes(source: StorySource, hook: string): StoryScene[] {
  const roles = DEFAULT_SCENE_SHAPE_BY_SOURCE_KIND[source.kind] ?? [
    "hook",
    "context",
    "story",
    "result",
    "cta",
  ]

  return roles.map((role, index) => {
    const typedRole = role as StorySceneRole
    const selectedAssets = pickAssetsForRole(source, typedRole)
    const overlayText = buildOverlayText(source, typedRole, index, hook)

    return {
      id: `${source.id}:scene:${index + 1}`,
      role: typedRole,
      title: buildSceneTitle(typedRole),
      overlayText,
      voiceoverText: buildVoiceoverText(source, typedRole, overlayText),
      durationSeconds: typedRole === "hook" ? 3 : typedRole === "cta" ? 3 : 4,
      media: selectedAssets.map(assetToMedia),
      metadata: {
        sourceAssetCount: selectedAssets.length,
      },
    }
  })
}

export function buildStoryDraftFromSource(source: StorySource): StoryDraft {
  const hook = inferHook(source)
  const caption = inferCaption(source, hook)
  const cta = inferCta(source)
  const scenes = buildScenes(source, hook)

  return {
    id: `draft:${source.id}`,
    shopId: source.shopId,
    sourceId: source.id,
    sourceKind: source.kind,
    title: source.title,
    hook,
    caption,
    cta,
    hashtags: [],
    tone: "professional",
    targetChannels: ["instagram_reel", "facebook_video", "youtube_short", "tiktok_video"],
    targetDurationSeconds: scenes.reduce(
      (sum, scene) => sum + (scene.durationSeconds ?? 0),
      0,
    ),
    summary: source.description ?? null,
    voiceoverText: scenes
      .map((scene) => scene.voiceoverText)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .join(" "),
    scriptText: scenes
      .map((scene) => scene.voiceoverText)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .join("\n"),
    scenes,
    metadata: {
      sourceOrigin: source.origin,
      sourceTags: source.tags,
      sourceRefs: source.refs,
    },
  }
}
