import type { StoryDraft, StoryScene } from "@/features/shopreel/story-builder/types";
import type { EditorVariant, SceneAssetReference } from "@/features/shopreel/editor/lib/session";

export type PersistedEditorScene = {
  id: string;
  transition: string;
  captionDirection: string;
  audioDirection: string;
  linkedAssets: SceneAssetReference[];
};

export type PersistedEditorSession = {
  version: 1;
  updatedAt: string;
  sceneOrder: string[];
  variants: EditorVariant[];
  scenes: PersistedEditorScene[];
  readiness: {
    storyboardComplete: boolean;
    assetCoverageRatio: number;
    captionCoverageRatio: number;
    audioCoverageRatio: number;
  };
};

export function buildPersistedEditorSession(draft: StoryDraft, variants: EditorVariant[]): PersistedEditorSession {
  const totalScenes = Math.max(1, draft.scenes.length);
  const scenes = draft.scenes.map((scene) => ({
    id: scene.id,
    transition: typeof scene.metadata?.transition === "string" ? scene.metadata.transition : "cut",
    captionDirection: scene.overlayText?.trim() ? "present" : "missing",
    audioDirection: scene.voiceoverText?.trim() ? "planned" : "missing",
    linkedAssets: (scene.media ?? []).map((media, idx) => ({
      id: `${media.contentAssetId ?? media.manualAssetId ?? media.url ?? idx}`,
      source: (media.contentAssetId ? "uploaded" : media.url ? "generated" : "reference") as SceneAssetReference["source"],
      label: media.contentAssetId ?? media.manualAssetId ?? `Asset ${idx + 1}`,
      url: typeof media.url === "string" ? media.url : null,
      aspectRatio: typeof media.metadata?.aspect_ratio === "string" ? media.metadata.aspect_ratio : null,
      durationSeconds: typeof media.metadata?.duration_seconds === "number" ? media.metadata.duration_seconds : null,
      readiness: (typeof media.url === "string" ? "ready" : "missing") as SceneAssetReference["readiness"],
    })),
  }));

  const storyboardComplete = draft.scenes.every((scene) => scene.title.trim().length > 0);
  const assetCoverageRatio = draft.scenes.filter((scene) => (scene.media ?? []).length > 0).length / totalScenes;
  const captionCoverageRatio = draft.scenes.filter((scene) => !!scene.overlayText?.trim()).length / totalScenes;
  const audioCoverageRatio = draft.scenes.filter((scene) => !!scene.voiceoverText?.trim()).length / totalScenes;

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    sceneOrder: draft.scenes.map((scene) => scene.id),
    variants,
    scenes,
    readiness: { storyboardComplete, assetCoverageRatio, captionCoverageRatio, audioCoverageRatio },
  };
}

export function reorderScenesByPersistedOrder(scenes: StoryScene[], persisted: PersistedEditorSession | null): StoryScene[] {
  if (!persisted || persisted.sceneOrder.length === 0) return scenes;
  const orderMap = new Map(persisted.sceneOrder.map((id, index) => [id, index]));
  return [...scenes].sort((a, b) => (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}
