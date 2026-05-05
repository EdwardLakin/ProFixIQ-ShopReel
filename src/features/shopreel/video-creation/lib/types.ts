export type VideoCreationJobType = "image" | "video" | "asset_assembly" | "series";

export type VideoCreationAspectRatio =
  | "9:16"
  | "16:9"
  | "1:1"
  | "4:5";

export type VideoCreationStyle =
  | "realistic"
  | "cinematic"
  | "ugc"
  | "product_demo"
  | "founder_led"
  | "cartoon"
  | "animated"
  | "commercial"
  | "editorial"
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
  | "bright"
  | "cartoon"
  | "animated";

export type VideoCreationProvider = "openai" | "runway" | "pika" | "luma" | "assembly";

export type VideoVoiceoverMode =
  | "none"
  | "ai_voice"
  | "script_only";

export type VideoMusicDirection =
  | "none"
  | "upbeat_launch"
  | "calm_founder"
  | "high_energy_reel"
  | "cinematic_build"
  | "lofi_tutorial"
  | "modern_product_demo"
  | "custom";

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
  voiceoverMode?: VideoVoiceoverMode;
  voiceoverScript?: string;
  musicDirection?: VideoMusicDirection;
  customMusicDirection?: string;
};

export const VIDEO_CREATION_JOB_TYPES: Array<{
  value: VideoCreationJobType;
  label: string;
  description: string;
}> = [
  {
    value: "video",
    label: "Create reel/video",
    description: "Create a short AI-guided vertical video from a prompt or approved concept.",
  },
  {
    value: "series",
    label: "Build multi-clip series",
    description: "Create a coordinated 4-clip sequence from one idea with shared visual direction.",
  },
  {
    value: "image",
    label: "Generate visual",
    description: "Create still images, thumbnails, concept frames, and scene art.",
  },
  {
    value: "asset_assembly",
    label: "Build from assets",
    description: "Turn uploaded or existing assets into a polished vertical reel foundation.",
  },
];

export const VIDEO_CREATION_STYLES: VideoCreationStyle[] = [
  "realistic",
  "cinematic",
  "ugc",
  "product_demo",
  "founder_led",
  "cartoon",
  "animated",
  "commercial",
  "editorial",
  "documentary",
  "social",
  "luxury",
  "technical",
];

export const VIDEO_CREATION_STYLE_DESCRIPTIONS: Record<VideoCreationStyle, string> = {
  realistic: "Natural, believable, real-world visuals.",
  cinematic: "Premium lighting, motion, and dramatic polish.",
  ugc: "Creator-style, casual, authentic, phone-native feel.",
  product_demo: "Clear product walkthrough and benefit-led demo.",
  founder_led: "Founder or expert explaining the idea directly.",
  cartoon: "Playful illustrated/cartoon direction.",
  animated: "Stylized animated explainer direction.",
  commercial: "Ad-ready polished marketing direction.",
  editorial: "Clean modern editorial look.",
  documentary: "Observed, grounded, story-driven footage.",
  social: "Fast-paced social-first pacing.",
  luxury: "High-end premium brand feel.",
  technical: "Precise, detailed, practical walkthrough.",
};

export const VIDEO_CREATION_VISUAL_MODES: VideoCreationVisualMode[] = [
  "photoreal",
  "brand_clean",
  "stylized",
  "cartoon",
  "animated",
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

export const VIDEO_CREATION_DURATIONS = [10, 15, 20, 30] as const;

export const VIDEO_VOICEOVER_MODES: Array<{
  value: VideoVoiceoverMode;
  label: string;
  description: string;
}> = [
  { value: "ai_voice", label: "AI voiceover", description: "Create a short voiceover script and direction." },
  { value: "script_only", label: "Script only", description: "Write the voiceover text but do not generate audio yet." },
  { value: "none", label: "No voiceover", description: "Visual-first video with captions and music direction." },
];

export const VIDEO_MUSIC_DIRECTIONS: Array<{
  value: VideoMusicDirection;
  label: string;
  description: string;
}> = [
  { value: "upbeat_launch", label: "Upbeat launch", description: "Bright, confident product-launch energy." },
  { value: "high_energy_reel", label: "High-energy reel", description: "Fast, punchy, scroll-stopping pace." },
  { value: "modern_product_demo", label: "Modern product demo", description: "Clean tech/product rhythm." },
  { value: "calm_founder", label: "Calm founder", description: "Confident, personal, less salesy." },
  { value: "cinematic_build", label: "Cinematic build", description: "Tension, payoff, and premium momentum." },
  { value: "lofi_tutorial", label: "Lo-fi tutorial", description: "Soft, helpful, tutorial-style feel." },
  { value: "none", label: "No music", description: "Keep the package voice/caption only." },
  { value: "custom", label: "Custom", description: "Describe the mood, tempo, or reference style." },
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
  if (jobType === "video") return 20;
  if (jobType === "series") return 10;
  if (jobType === "asset_assembly") return 15;
  return null;
}

export function musicDirectionLabel(value: VideoMusicDirection, customValue?: string) {
  if (value === "custom") return customValue?.trim() || "Custom music direction";
  return VIDEO_MUSIC_DIRECTIONS.find((item) => item.value === value)?.label ?? formatLabel(value);
}

export function buildEnhancedPrompt(input: VideoCreationFormInput): string {
  const parts = [
    input.prompt.trim(),
    `Style: ${input.style}.`,
    `Visual mode: ${input.visualMode}.`,
    `Aspect ratio: ${input.aspectRatio}.`,
  ];

  if ((input.jobType === "video" || input.jobType === "series") && input.durationSeconds) {
    parts.push(`Target duration: ${input.durationSeconds} seconds.`);
  }

  if (input.voiceoverMode && input.voiceoverMode !== "none") {
    parts.push(`Voiceover mode: ${input.voiceoverMode}.`);
  }

  if (input.voiceoverScript?.trim()) {
    parts.push(`Voiceover/script direction: ${input.voiceoverScript.trim()}.`);
  }

  if (input.musicDirection && input.musicDirection !== "none") {
    parts.push(`Music direction: ${musicDirectionLabel(input.musicDirection, input.customMusicDirection)}. Use this as mood/tempo guidance only; do not require copyrighted music.`);
  }

  if (input.negativePrompt.trim()) {
    parts.push(`Avoid: ${input.negativePrompt.trim()}.`);
  }

  return parts.filter(Boolean).join(" ");
}
