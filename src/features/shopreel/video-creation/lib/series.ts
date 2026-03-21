import type {
  VideoCreationAspectRatio,
  VideoCreationStyle,
  VideoCreationVisualMode,
} from "./types";

export type PlannedSeriesScene = {
  sceneOrder: number;
  title: string;
  prompt: string;
  durationSeconds: number;
};

type SeriesPlanInput = {
  title: string;
  prompt: string;
  negativePrompt?: string;
  style: VideoCreationStyle;
  visualMode: VideoCreationVisualMode;
  aspectRatio: VideoCreationAspectRatio;
  durationSeconds: number;
};

const CONTINUITY_RULE =
  "Maintain the same subject family, environment family, wardrobe logic, styling logic, camera language, lighting family, color world, and overall mood across every scene so the output feels like one cohesive series.";

const SILENT_RULE =
  "No spoken dialogue. No subtitles. No captions. No on-screen text. Visual storytelling only.";

export function planManualSeriesScenes(input: SeriesPlanInput): PlannedSeriesScene[] {
  const base = [
    input.prompt.trim(),
    `Style: ${input.style}.`,
    `Visual mode: ${input.visualMode}.`,
    `Aspect ratio: ${input.aspectRatio}.`,
    CONTINUITY_RULE,
    SILENT_RULE,
    input.negativePrompt?.trim()
      ? `Avoid: ${input.negativePrompt.trim()}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    {
      sceneOrder: 1,
      title: `${input.title} — Hook`,
      prompt: `${base} Scene objective: create a powerful opening hook that stops the scroll immediately.`,
      durationSeconds: input.durationSeconds,
    },
    {
      sceneOrder: 2,
      title: `${input.title} — Problem`,
      prompt: `${base} Scene objective: clearly show the pain point, friction, old way, or struggle.`,
      durationSeconds: input.durationSeconds,
    },
    {
      sceneOrder: 3,
      title: `${input.title} — Solution`,
      prompt: `${base} Scene objective: show the better way, transformation, system, process, or product in action.`,
      durationSeconds: input.durationSeconds,
    },
    {
      sceneOrder: 4,
      title: `${input.title} — Outcome`,
      prompt: `${base} Scene objective: show the payoff, result, confidence, momentum, or final polished outcome.`,
      durationSeconds: input.durationSeconds,
    },
  ];
}
