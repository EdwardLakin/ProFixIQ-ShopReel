export function buildReelPlan(concept: any) {
  return {
    hookShot: "Vehicle reveal in shop bay",
    problemShot: "Show worn or broken part",
    inspectionShot: "Technician inspecting vehicle",
    repairShot: "Repair work in progress",
    resultShot: "Vehicle finished and ready",
    overlayText: concept.hook,
    caption: concept.caption,
    cta: concept.cta,
  };
}
