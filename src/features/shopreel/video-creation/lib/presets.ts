import type {
  VideoCreationAspectRatio,
  VideoCreationJobType,
  VideoCreationStyle,
  VideoCreationVisualMode,
} from "./types";

export type VideoCreationPreset = {
  id: string;
  title: string;
  description: string;
  jobType: VideoCreationJobType;
  prompt: string;
  negativePrompt: string;
  style: VideoCreationStyle;
  visualMode: VideoCreationVisualMode;
  aspectRatio: VideoCreationAspectRatio;
  durationSeconds: number | null;
};

export const VIDEO_CREATION_PRESETS: VideoCreationPreset[] = [
  {
    id: "cinematic-repair-reel",
    title: "Cinematic Repair Reel",
    description: "Premium vertical social video showing repair detail, motion, and shop atmosphere.",
    jobType: "video",
    prompt:
      "Create a cinematic vertical repair reel with dramatic light, close-up mechanical detail, premium startup-style camera movement, realistic shop environment, and social-ready pacing.",
    negativePrompt:
      "Avoid low detail, distorted tools, unreadable text, unrealistic metal textures, duplicate parts.",
    style: "cinematic",
    visualMode: "photoreal",
    aspectRatio: "9:16",
    durationSeconds: 8,
  },
  {
    id: "technical-inspection-visual",
    title: "Technical Inspection Visual",
    description: "High-clarity still frame for inspection findings, technical education, and authority content.",
    jobType: "image",
    prompt:
      "Create a clean technical inspection visual showing brake components in a modern heavy-duty repair environment with strong clarity, premium industrial detail, and educational composition.",
    negativePrompt:
      "Avoid blur, fantasy styling, messy background, unrealistic parts, extra wheels, broken anatomy.",
    style: "technical",
    visualMode: "brand_clean",
    aspectRatio: "4:5",
    durationSeconds: null,
  },
  {
    id: "before-after-showcase",
    title: "Before / After Showcase",
    description: "Polished before-and-after style vertical social asset.",
    jobType: "asset_assembly",
    prompt:
      "Assemble a premium before-and-after vertical reel with strong pacing, clean transitions, clear reveal moments, and polished social storytelling.",
    negativePrompt:
      "Avoid chaotic pacing, low contrast, cluttered frame order, and abrupt transitions.",
    style: "commercial",
    visualMode: "bright",
    aspectRatio: "9:16",
    durationSeconds: 15,
  },
  {
    id: "luxury-brand-visual",
    title: "Luxury Brand Visual",
    description: "Premium branded scene for hero content, ads, and launch visuals.",
    jobType: "image",
    prompt:
      "Create a luxury branded visual with sleek composition, subtle reflections, modern premium lighting, and clean high-end startup aesthetic.",
    negativePrompt:
      "Avoid clutter, flat lighting, amateur composition, low detail, overexposed highlights.",
    style: "luxury",
    visualMode: "moody",
    aspectRatio: "1:1",
    durationSeconds: null,
  },
];
