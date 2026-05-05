
export const SHOPREEL_AI_MODELS = {

  text: process.env.OPENAI_TEXT_MODEL ?? "gpt-5.5",

  vision: process.env.OPENAI_VISION_MODEL ?? process.env.OPENAI_TEXT_MODEL ?? "gpt-5.5",

  image: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2",

  videoDraft: process.env.OPENAI_VIDEO_DRAFT_MODEL ?? "sora-2",

  videoProduction: process.env.OPENAI_VIDEO_PRODUCTION_MODEL ?? "sora-2-pro",

} as const;

