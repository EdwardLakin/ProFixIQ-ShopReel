import type { StoryDraft } from "../story-builder"

export type ReelBuilderConcept = {
  hook?: string | null
  caption?: string | null
  cta?: string | null
}

function sceneDirection(role: string): string {
  switch (role) {
    case "hook":
      return "Strong opening visual that immediately shows the job or result"
    case "problem":
    case "finding":
      return "Close-up visual showing the issue, wear, or failed component"
    case "inspection":
      return "Technician inspecting or verifying the condition"
    case "repair":
    case "process":
      return "Hands-on work in progress with clear movement"
    case "before":
      return "Clear before visual from the start of the job"
    case "after":
    case "result":
      return "Finished result reveal with stable framing"
    case "cta":
      return "Final branded shot or completed result held long enough for CTA"
    default:
      return "Relevant supporting visual for this part of the story"
  }
}

export function buildReelPlan(concept: ReelBuilderConcept | StoryDraft) {
  const draft = concept as StoryDraft
  const scenes = Array.isArray(draft?.scenes) ? draft.scenes : null

  if (scenes && scenes.length > 0) {
    return {
      hookShot: scenes[0]?.title ?? "Hook",
      problemShot: scenes.find((scene) => scene.role === "problem" || scene.role === "finding")?.title ??
        "Problem",
      inspectionShot: scenes.find((scene) => scene.role === "context" || scene.role === "explanation")?.title ??
        "Inspection",
      repairShot: scenes.find((scene) => scene.role === "repair" || scene.role === "process")?.title ??
        "Process",
      resultShot: scenes.find((scene) => scene.role === "result" || scene.role === "after")?.title ??
        "Result",
      overlayText: draft.hook ?? scenes[0]?.overlayText ?? "",
      caption: draft.caption ?? "",
      cta: draft.cta ?? "",
      scenePlan: scenes.map((scene, index) => ({
        order: index + 1,
        role: scene.role,
        title: scene.title,
        direction: sceneDirection(scene.role),
        overlayText: scene.overlayText ?? scene.title,
        durationSeconds: scene.durationSeconds ?? 4,
        media: scene.media,
      })),
    }
  }

  return {
    hookShot: "Vehicle reveal in shop bay",
    problemShot: "Show worn or broken part",
    inspectionShot: "Technician inspecting vehicle",
    repairShot: "Repair work in progress",
    resultShot: "Vehicle finished and ready",
    overlayText: concept.hook ?? "",
    caption: concept.caption ?? "",
    cta: concept.cta ?? "",
    scenePlan: [],
  }
}
