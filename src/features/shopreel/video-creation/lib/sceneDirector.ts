export type DirectedSceneInput = {
  basePrompt: string;
  title: string;
  sceneLabel: "Hook" | "Problem" | "Solution" | "Outcome";
  style: string;
  visualMode: string;
  aspectRatio: string;
  durationSeconds: number;
  negativePrompt?: string;
  continuityNotes?: string[];
};

function buildContinuityBlock(input: DirectedSceneInput) {
  return [
    "Keep the same core subject, same environment family, same wardrobe/style logic, same lighting family, and same camera language across every clip in this series.",
    "Do not switch to unrelated objects, unrelated people, or a different setting.",
    input.continuityNotes?.length
      ? `Continuity notes: ${input.continuityNotes.join("; ")}.`
      : "",
    `Style: ${input.style}.`,
    `Visual mode: ${input.visualMode}.`,
    `Aspect ratio: ${input.aspectRatio}.`,
    `Target duration: ${input.durationSeconds} seconds.`,
    input.negativePrompt?.trim()
      ? `Avoid: ${input.negativePrompt.trim()}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildDirectedScenePrompt(input: DirectedSceneInput) {
  const continuity = buildContinuityBlock(input);

  const sceneDirection: Record<DirectedSceneInput["sceneLabel"], string> = {
    Hook: [
      "Scene goal: stop the scroll immediately.",
      "Show one strong visual moment.",
      "Keep composition simple and instantly understandable.",
      "No explanation-heavy setup.",
    ].join(" "),
    Problem: [
      "Scene goal: show the tension, friction, pain, or old way.",
      "Emphasize the problem clearly with believable real-world detail.",
      "Do not resolve it yet.",
    ].join(" "),
    Solution: [
      "Scene goal: reveal the better way, product, service, system, or transformation.",
      "Make the improvement visually obvious.",
      "Keep it realistic and usable.",
    ].join(" "),
    Outcome: [
      "Scene goal: show the payoff, result, confidence, clarity, growth, or final state.",
      "End with a polished, satisfying visual outcome.",
      "Feel premium and complete.",
    ].join(" "),
  };

  return [
    input.basePrompt.trim(),
    `Series title: ${input.title}.`,
    `Scene: ${input.sceneLabel}.`,
    sceneDirection[input.sceneLabel],
    continuity,
  ].join(" ");
}
