import { openai } from "@/features/ai/server/openai";

export async function generateContentCalendar(shopName: string) {
  const prompt = `
Create a 7 day content calendar for an automotive repair shop.

Include:
- video idea
- content type
- hook
- CTA

Return JSON array with 7 items.
`;

  const res = await openai.responses.create({
    model: "gpt-4.1",
    input: prompt,
  });

  return JSON.parse(res.output_text);
}
