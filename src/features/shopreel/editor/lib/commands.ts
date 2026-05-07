import type { StoryDraft, StoryScene, StorySceneMedia } from "@/features/shopreel/story-builder/types";
import type { EditorVariant } from "@/features/shopreel/editor/lib/session";

export type EditorCommandType =
  | "scene.reorder"
  | "scene.insert"
  | "scene.duplicate"
  | "scene.remove"
  | "scene.split"
  | "scene.merge"
  | "scene.update"
  | "asset.attach"
  | "asset.detach"
  | "asset.replace"
  | "asset.move"
  | "variant.create"
  | "variant.rename"
  | "variant.setActive"
  | "caption.update"
  | "audio.update"
  | "transition.update";

type SceneBasePayload = { sceneId: string };

export type EditorCommandPayload =
  | ({ type: "scene.reorder" } & SceneBasePayload & { direction: -1 | 1 })
  | ({ type: "scene.insert" } & SceneBasePayload)
  | ({ type: "scene.duplicate" } & SceneBasePayload)
  | ({ type: "scene.remove" } & SceneBasePayload)
  | ({ type: "scene.split" } & SceneBasePayload)
  | ({ type: "scene.merge" } & SceneBasePayload)
  | ({ type: "scene.update" } & SceneBasePayload & { patch: Partial<Pick<StoryScene, "title" | "overlayText" | "voiceoverText" | "durationSeconds">> })
  | ({ type: "asset.attach" } & SceneBasePayload & { media: StorySceneMedia })
  | ({ type: "asset.detach" } & SceneBasePayload & { assetIndex: number })
  | ({ type: "asset.replace" } & SceneBasePayload & { assetIndex: number; media: StorySceneMedia })
  | ({ type: "asset.move" } & SceneBasePayload & { assetIndex: number; targetSceneId: string; duplicate?: boolean })
  | ({ type: "variant.create" } & { parentVariantId: string | null; platform: EditorVariant["targetPlatform"] })
  | ({ type: "variant.rename" } & { variantId: string; name: string })
  | ({ type: "variant.setActive" } & { variantId: string })
  | ({ type: "caption.update" } & SceneBasePayload & { caption: string })
  | ({ type: "audio.update" } & SceneBasePayload & { voiceover: string })
  | ({ type: "transition.update" } & SceneBasePayload & { transition: string });

export type EditorCommandStatus = "applied" | "failed";
export type EditorCommand = {
  id: string;
  type: EditorCommandType;
  createdAt: string;
  sessionId: string;
  transactionId: string;
  payload: EditorCommandPayload;
  before: { sceneOrder: string[]; sceneCount: number; variantCount: number };
  after: { sceneOrder: string[]; sceneCount: number; variantCount: number; activeSceneId: string | null; activeVariantId: string | null };
  status: EditorCommandStatus;
};

export type CommandState = {
  draft: StoryDraft;
  variants: EditorVariant[];
  activeVariantId: string | null;
  activeSceneId: string | null;
};

export type AppliedCommand = { nextState: CommandState; warnings: string[]; command: EditorCommand };

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function normalizeScenes(scenes: StoryScene[]): StoryScene[] {
  return scenes.map((scene, index) => ({ ...scene, order: index + 1 }));
}

function splitScene(source: StoryScene): [StoryScene, StoryScene] {
  const total = Math.max(2, Number(source.durationSeconds ?? 4));
  const firstDuration = Math.max(1, Math.floor(total / 2));
  const secondDuration = Math.max(1, total - firstDuration);
  return [
    { ...source, durationSeconds: firstDuration, title: source.title || "Scene", media: [...(source.media ?? [])] },
    { ...source, id: uid("scene"), durationSeconds: secondDuration, title: `${source.title || "Scene"} (Continuation)`, media: [...(source.media ?? [])] },
  ];
}

export function applyEditorCommand(state: CommandState, input: EditorCommandPayload, sessionId: string): AppliedCommand {
  const next = clone(state);
  const warnings: string[] = [];
  const sceneIndex = "sceneId" in input ? next.draft.scenes.findIndex((scene) => scene.id === input.sceneId) : -1;
  const commandType = input.type;

  if ("sceneId" in input && sceneIndex < 0) warnings.push("Scene not found for command payload.");

  switch (commandType) {
    case "scene.reorder": {
      if (sceneIndex < 0) break;
      const target = sceneIndex + input.direction;
      if (target < 0 || target >= next.draft.scenes.length) {
        warnings.push("Scene is already at edge.");
        break;
      }
      const scenes = [...next.draft.scenes];
      const [moved] = scenes.splice(sceneIndex, 1);
      scenes.splice(target, 0, moved);
      next.draft.scenes = normalizeScenes(scenes);
      break;
    }
    case "scene.insert": {
      if (sceneIndex < 0) break;
      const source = next.draft.scenes[sceneIndex];
      const insert: StoryScene = { ...source, id: uid("scene"), title: "Inserted scene", media: [] };
      const scenes = [...next.draft.scenes];
      scenes.splice(sceneIndex + 1, 0, insert);
      next.draft.scenes = normalizeScenes(scenes);
      next.activeSceneId = insert.id;
      break;
    }
    case "scene.duplicate": {
      if (sceneIndex < 0) break;
      const source = next.draft.scenes[sceneIndex];
      const duplicate: StoryScene = { ...source, id: uid("scene"), media: [...(source.media ?? [])] };
      const scenes = [...next.draft.scenes];
      scenes.splice(sceneIndex + 1, 0, duplicate);
      next.draft.scenes = normalizeScenes(scenes);
      next.activeSceneId = duplicate.id;
      break;
    }
    case "scene.remove": {
      if (sceneIndex < 0) break;
      const scenes = next.draft.scenes.filter((scene) => scene.id !== input.sceneId);
      next.draft.scenes = normalizeScenes(scenes);
      next.activeSceneId = next.draft.scenes[Math.max(0, sceneIndex - 1)]?.id ?? null;
      break;
    }
    case "scene.split": {
      if (sceneIndex < 0) break;
      const source = next.draft.scenes[sceneIndex];
      const [first, second] = splitScene(source);
      const scenes = [...next.draft.scenes];
      scenes.splice(sceneIndex, 1, first, second);
      next.draft.scenes = normalizeScenes(scenes);
      next.activeSceneId = second.id;
      break;
    }
    case "scene.merge": {
      if (sceneIndex < 0 || sceneIndex >= next.draft.scenes.length - 1) { warnings.push("No next scene to merge."); break; }
      const current = next.draft.scenes[sceneIndex];
      const following = next.draft.scenes[sceneIndex + 1];
      const merged: StoryScene = {
        ...current,
        durationSeconds: Math.max(1, Number(current.durationSeconds ?? 1) + Number(following.durationSeconds ?? 1)),
        overlayText: [current.overlayText, following.overlayText].filter((value) => !!value?.trim()).join(" "),
        voiceoverText: [current.voiceoverText, following.voiceoverText].filter((value) => !!value?.trim()).join(" "),
        media: [...(current.media ?? []), ...(following.media ?? [])],
      };
      const scenes = [...next.draft.scenes];
      scenes.splice(sceneIndex, 2, merged);
      next.draft.scenes = normalizeScenes(scenes);
      break;
    }
    case "scene.update": if (sceneIndex >= 0) next.draft.scenes[sceneIndex] = { ...next.draft.scenes[sceneIndex], ...input.patch }; break;
    case "asset.attach": if (sceneIndex >= 0) next.draft.scenes[sceneIndex].media = [...(next.draft.scenes[sceneIndex].media ?? []), input.media]; break;
    case "asset.detach": if (sceneIndex >= 0) next.draft.scenes[sceneIndex].media = (next.draft.scenes[sceneIndex].media ?? []).filter((_, idx) => idx !== input.assetIndex); break;
    case "asset.replace": if (sceneIndex >= 0) next.draft.scenes[sceneIndex].media = (next.draft.scenes[sceneIndex].media ?? []).map((asset, idx) => idx === input.assetIndex ? input.media : asset); break;
    case "asset.move": {
      if (sceneIndex < 0) break;
      const from = next.draft.scenes[sceneIndex];
      const toIndex = next.draft.scenes.findIndex((scene) => scene.id === input.targetSceneId);
      if (toIndex < 0) { warnings.push("Target scene not found."); break; }
      const media = from.media?.[input.assetIndex];
      if (!media) { warnings.push("Asset index not found."); break; }
      if (!input.duplicate) from.media = (from.media ?? []).filter((_, idx) => idx !== input.assetIndex);
      next.draft.scenes[toIndex].media = [...(next.draft.scenes[toIndex].media ?? []), media];
      break;
    }
    case "variant.create": {
      const v: EditorVariant = { id: uid("variant"), name: "Child variant", targetPlatform: input.platform, targetDuration: 30, captionDensity: "medium", ctaStyle: "soft", framingPreference: "9:16", sourceVariantId: input.parentVariantId };
      next.variants = [...next.variants, v];
      next.activeVariantId = v.id;
      break;
    }
    case "variant.rename": next.variants = next.variants.map((v) => v.id === input.variantId ? { ...v, name: input.name } : v); break;
    case "variant.setActive": next.activeVariantId = input.variantId; break;
    case "caption.update": if (sceneIndex >= 0) next.draft.scenes[sceneIndex].overlayText = input.caption; break;
    case "audio.update": if (sceneIndex >= 0) next.draft.scenes[sceneIndex].voiceoverText = input.voiceover; break;
    case "transition.update": if (sceneIndex >= 0) next.draft.scenes[sceneIndex] = { ...next.draft.scenes[sceneIndex], metadata: { ...(next.draft.scenes[sceneIndex].metadata ?? {}), transition: input.transition } }; break;
    default: break;
  }

  const command: EditorCommand = {
    id: uid("cmd"), createdAt: new Date().toISOString(), transactionId: uid("tx"), sessionId, type: commandType, payload: input,
    before: { sceneOrder: state.draft.scenes.map((s) => s.id), sceneCount: state.draft.scenes.length, variantCount: state.variants.length },
    after: { sceneOrder: next.draft.scenes.map((s) => s.id), sceneCount: next.draft.scenes.length, variantCount: next.variants.length, activeSceneId: next.activeSceneId, activeVariantId: next.activeVariantId },
    status: warnings.length > 0 ? "failed" : "applied",
  };

  return { nextState: next, warnings, command };
}

export function rollbackEditorCommand(previousState: CommandState): CommandState {
  return clone(previousState);
}
