import type { Database } from "@/types/supabase";

type MediaJob = Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

export function buildFinalPrompt(job: MediaJob) {
  const base = job.prompt_enhanced || job.prompt || "";

  const hasAssets = Array.isArray(job.input_asset_ids) && job.input_asset_ids.length > 0;

  const continuity = [
    "Maintain subject consistency.",
    "Do not change identity or environment between frames.",
    job.style ? `Style: ${job.style}.` : "",
    job.visual_mode ? `Visual mode: ${job.visual_mode}.` : "",
    job.aspect_ratio ? `Aspect ratio: ${job.aspect_ratio}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  // 🔑 KEY LOGIC: asset-grounded vs AI concept
  if (hasAssets) {
    return [
      base,
      "Use the provided uploaded media as the primary visual source.",
      "Do NOT invent new subjects.",
      "Enhance, reframe, animate, or stylize the existing content.",
      "Keep continuity with the real footage.",
      continuity,
    ].join(" ");
  }

  return [
    base,
    "Generate a realistic scene based on the prompt.",
    "Keep visuals grounded and believable.",
    continuity,
  ].join(" ");
}
