export type PromptEnhancerInput = {
  prompt: string;
  brandVoice: string;
  audience: string;
  objective: string;
};

export function enhanceCreativePrompt(input: PromptEnhancerInput): string {
  const parts = [
    input.prompt.trim(),
    input.brandVoice.trim() ? `Brand voice: ${input.brandVoice.trim()}.` : "",
    input.audience.trim() ? `Audience: ${input.audience.trim()}.` : "",
    input.objective.trim() ? `Objective: ${input.objective.trim()}.` : "",
    "Keep the output visually premium, clear, modern, and social-first.",
  ];

  return parts.filter(Boolean).join(" ");
}
