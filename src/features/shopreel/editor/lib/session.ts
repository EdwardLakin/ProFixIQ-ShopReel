import type { StoryDraft, StoryScene, StorySceneMedia } from "@/features/shopreel/story-builder/types";

export type SceneAssetSource = "uploaded" | "generated" | "reference";
export type EditorSceneStatus = "ready" | "needs_media" | "needs_copy" | "draft";
export type EditorSceneType = "hook" | "body" | "proof" | "cta";

export type SceneAssetReference = {
  id: string;
  source: SceneAssetSource;
  label: string;
  url: string | null;
  aspectRatio: string | null;
  durationSeconds: number | null;
  readiness: "ready" | "missing";
};

export type CaptionTrack = {
  enabled: boolean;
  style: "clean" | "high-contrast" | "kinetic";
  emphasis: "none" | "keywords" | "cta";
  placement: "bottom" | "center";
  timingMode: "placeholder";
};

export type VoiceoverTrack = {
  mode: "planned" | "generated";
  text: string;
  muted: boolean;
};

export type MusicTrack = {
  mood: string;
  pacingEnergy: "low" | "medium" | "high";
  planned: boolean;
  muted: boolean;
};

export type EditorScene = {
  id: string;
  order: number;
  sceneType: EditorSceneType;
  title: string;
  duration: number;
  transition: string;
  motionPreset: string;
  prompt: string;
  visualDirection: string;
  caption: string;
  voiceover: string;
  status: EditorSceneStatus;
  linkedAssets: SceneAssetReference[];
  generatedAssetIds: string[];
  timing: { startSeconds: number; endSeconds: number };
  captionTrack: CaptionTrack;
  voiceoverTrack: VoiceoverTrack;
  musicTrack: MusicTrack;
};

export type EditorVariant = {
  id: string;
  name: string;
  targetPlatform: "instagram" | "tiktok" | "youtube_shorts" | "ad";
  targetDuration: number;
  captionDensity: "low" | "medium" | "high";
  ctaStyle: "soft" | "direct";
  framingPreference: "9:16" | "1:1" | "16:9";
  sourceVariantId: string | null;
};

export type EditorSession = {
  id: string;
  title: string;
  sourceGenerationId: string;
  scenes: EditorScene[];
  variants: EditorVariant[];
};

function sceneTypeFromRole(role: StoryScene["role"]): EditorSceneType {
  if (role === "hook") return "hook";
  if (role === "cta") return "cta";
  if (role === "demo" || role === "repair" || role === "result") return "proof";
  return "body";
}

function sceneStatus(scene: StoryScene, linkedAssets: SceneAssetReference[]): EditorSceneStatus {
  if (!scene.voiceoverText?.trim() && !scene.overlayText?.trim()) return "needs_copy";
  if (linkedAssets.length === 0) return "needs_media";
  if (!scene.title.trim()) return "draft";
  return "ready";
}

function mapMedia(media: StorySceneMedia, idx: number): SceneAssetReference {
  const url = typeof media.url === "string" ? media.url : null;
  const metadata = media.metadata ?? {};
  const aspectRatio = typeof metadata.aspect_ratio === "string" ? metadata.aspect_ratio : null;
  const durationSeconds = typeof metadata.duration_seconds === "number" ? metadata.duration_seconds : null;
  const generatedFromJob = typeof metadata.generated_job_id === "string";
  const source: SceneAssetSource = media.contentAssetId
    ? "uploaded"
    : generatedFromJob
      ? "generated"
      : "reference";

  return {
    id: `${media.contentAssetId ?? media.manualAssetId ?? url ?? idx}`,
    source,
    label: media.contentAssetId ?? media.manualAssetId ?? `Asset ${idx + 1}`,
    url,
    aspectRatio,
    durationSeconds,
    readiness: url ? "ready" : "missing",
  };
}

export function buildEditorSessionFromDraft(generationId: string, draft: StoryDraft): EditorSession {
  let cursor = 0;
  const scenes: EditorScene[] = draft.scenes.map((scene, index) => {
    const duration = Math.max(1, Number(scene.durationSeconds ?? 3));
    const linkedAssets = (scene.media ?? []).map(mapMedia);
    const mapped: EditorScene = {
      id: scene.id,
      order: index + 1,
      sceneType: sceneTypeFromRole(scene.role),
      title: scene.title,
      duration,
      transition: "cut",
      motionPreset: "steady",
      prompt: scene.title,
      visualDirection: typeof scene.metadata?.visualDirection === "string" ? scene.metadata.visualDirection : "",
      caption: scene.overlayText ?? "",
      voiceover: scene.voiceoverText ?? "",
      status: sceneStatus(scene, linkedAssets),
      linkedAssets,
      generatedAssetIds: linkedAssets.filter((item) => item.source === "generated").map((item) => item.id),
      timing: { startSeconds: cursor, endSeconds: cursor + duration },
      captionTrack: { enabled: true, style: "clean", emphasis: "keywords", placement: "bottom", timingMode: "placeholder" },
      voiceoverTrack: { mode: "planned", text: scene.voiceoverText ?? "", muted: false },
      musicTrack: { mood: "uplifting", pacingEnergy: "medium", planned: true, muted: false },
    };
    cursor += duration;
    return mapped;
  });

  return { id: `session-${generationId}`, title: draft.title, sourceGenerationId: generationId, scenes, variants: [] };
}
