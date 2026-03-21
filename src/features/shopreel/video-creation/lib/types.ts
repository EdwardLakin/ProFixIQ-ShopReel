export type VideoCreationJobType =
  | "image"
  | "video"
  | "asset_assembly"
  | "build_series";

export type VideoCreationAspectRatio =
  | "9:16"
  | "16:9"
  | "1:1"
  | "4:5";

export type VideoCreationStyle =
  | "cinematic"
  | "commercial"
  | "editorial"
  | "product"
  | "documentary"
  | "social"
  | "luxury"
  | "technical";

export type VideoCreationVisualMode =
  | "photoreal"
  | "stylized"
  | "brand_clean"
  | "high_contrast"
  | "moody"
  | "bright";

export type VideoCreationProvider =
  | "openai"
  | "runway"
  | "pika"
  | "luma"
  | "assembly";

export type VideoCreationFormInput = {
  title: string;
  prompt: string;
  negativePrompt: string;
  jobType: VideoCreationJobType;
  provider: VideoCreationProvider;
  style: VideoCreationStyle;
  visualMode: VideoCreationVisualMode;
  aspectRatio: VideoCreationAspectRatio;
  durationSeconds: number | null;
  inputAssetIds: string[];
};

export const VIDEO_CREATION_JOB_TYPES: Array<{
  value: VideoCreationJobType;
  label: string;
  description: string;
}> = [
  {
    value: "image",
    label: "Generate visual",
    description: "Create still images, thumbnails, concept frames, and scene art.",
  },
  {
    value: "video",
    label: "Generate clip",
    description: "Create one AI-generated motion clip from a single prompt.",
  },
  {
    value: "build_series",
    label: "Build series",
    description: "Turn one idea into a structured 4-scene sequence.",
  },
  {
    value: "asset_assembly",
    label: "Build from assets",
    description: "Turn uploaded or existing assets into a polished vertical reel foundation.",
  },
];

export const VIDEO_CREATION_STYLES: VideoCreationStyle[] = [
  "cinematic",
  "commercial",
  "editorial",
  "product",
  "documentary",
  "social",
  "luxury",
  "technical",
];

export const VIDEO_CREATION_VISUAL_MODES: VideoCreationVisualMode[] = [
  "photoreal",
  "stylized",
  "brand_clean",
  "high_contrast",
  "moody",
  "bright",
];

export const VIDEO_CREATION_ASPECT_RATIOS: VideoCreationAspectRatio[] = [
  "9:16",
  "16:9",
  "1:1",
  "4:5",
];

export const VIDEO_CREATION_PROVIDERS: Array<{
  value: VideoCreationProvider;
  label: string;
}> = [
  { value: "openai", label: "OpenAI" },
  { value: "runway", label: "Runway" },
  { value: "pika", label: "Pika" },
  { value: "luma", label: "Luma" },
  { value: "assembly", label: "Asset Assembly" },
];

export function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function suggestDefaultDuration(jobType: VideoCreationJobType): number | null {
  if (jobType === "video") return 8;
  if (jobType === "build_series") return 8;
  if (jobType === "asset_assembly") return 15;
  return null;
}

export function buildEnhancedPrompt(input: VideoCreationFormInput): string {
  const parts = [
    input.prompt.trim(),
    `Style: ${input.style}.`,
    `Visual mode: ${input.visualMode}.`,
    `Aspect ratio: ${input.aspectRatio}.`,
  ];

  if ((input.jobType === "video" || input.jobType === "build_series") && input.durationSeconds) {
    parts.push(`Target duration: ${input.durationSeconds} seconds.`);
  }

  if (input.negativePrompt.trim()) {
    parts.push(`Avoid: ${input.negativePrompt.trim()}.`);
  }

  return parts.filter(Boolean).join(" ");
}
