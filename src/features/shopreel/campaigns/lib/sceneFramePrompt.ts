type SceneFrameInput = {
  itemTitle: string;
  sceneTitle: string;
  basePrompt: string;
  emotionalBeat?: string | null;
  visualDirection?: string | null;
  cameraFraming?: string | null;
  lighting?: string | null;
  overlayNarrationHint?: string | null;
  platformPacingContext?: string | null;
};

export function buildSceneFramePrompt(input: SceneFrameInput): { prompt: string; negativePrompt: string } {
  const prompt = [
    `Create a photoreal cinematic keyframe for ShopReel scene \"${input.sceneTitle}\" from campaign \"${input.itemTitle}\".`,
    `Subject and behavior: ${input.basePrompt}.`,
    `Emotional state: ${input.emotionalBeat ?? "grounded human tension and believable micro-expression"}.`,
    `Environment and visual direction: ${input.visualDirection ?? "real-world environment with lived-in textures and practical props"}.`,
    `Composition and camera framing: ${input.cameraFraming ?? "tight medium framing, readable subject silhouette, cinematic depth"}.`,
    `Lighting and mood: ${input.lighting ?? "natural practical lighting with controlled contrast and realistic skin tones"}.`,
    `Narrative overlay/narration hint: ${input.overlayNarrationHint ?? "keep visual storytelling dominant; no mandatory text overlays"}.`,
    `Platform pacing context: ${input.platformPacingContext ?? "first-frame hook clarity for TikTok/Reels/Shorts"}.`,
    "Realism constraints: natural anatomy, accurate hands/faces, physically plausible reflections, non-plastic skin, true-to-life textures.",
  ].join(" ");

  const negativePrompt = [
    "generic marketing stock photo",
    "plastic CGI look",
    "distorted hands",
    "deformed face",
    "unreadable text",
    "fake UI overlays",
    "over-smoothed skin",
    "watermark",
  ].join(", ");

  return { prompt, negativePrompt };
}
