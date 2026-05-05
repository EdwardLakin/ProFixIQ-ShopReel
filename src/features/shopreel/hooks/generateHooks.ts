import { openai } from "@/features/ai/server/openai";
import { SHOPREEL_AI_MODELS } from "@/features/shopreel/ai/modelConfig";

export async function generateHooks(contentType: string, vehicle?: string) {
  const prompt = `
Generate 10 viral short-form video hooks for an auto repair shop.

Content type: ${contentType}
Vehicle: ${vehicle ?? "generic vehicle"}

Hooks must:
- grab attention in first 2 seconds
- be short
- be curiosity driven

Return JSON array.
`;

  const response = await openai.responses.create({
    model: SHOPREEL_AI_MODELS.text,
    input: prompt,
  });

  const text = response.output_text;

  try {
    return JSON.parse(text);
  } catch {
    return text.split("\n").filter(Boolean);
  }
}
