import { openai } from "@/features/ai/server/openai";
import type { BlogLengthMode, BlogStyle } from "./buildCreatorOutputs";

type Input = {
  topic: string;
  sectionTitle: string;
  existingBody: string;
  allSections: Array<{ key: string; title: string; body: string }>;
  summary: string;
  hook: string;
  context: string;
  explanation: string;
  takeaway: string;
  cta: string;
  audience?: string | null;
  blogStyle?: BlogStyle;
  blogLengthMode?: BlogLengthMode;
};

function clean(value: string) {
  return value
    .replace(/SYSTEM INSTRUCTIONS[\s\S]*/gi, "")
    .replace(/^Topic:\s.*$/gim, "")
    .replace(/^Instructions:\s.*$/gim, "")
    .replace(/^Structure:\s.*$/gim, "")
    .replace(/^Only output.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateBlogSection(input: Input): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.9,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "blog_section_regeneration",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            body: { type: "string" },
          },
          required: ["body"],
        },
      },
    },
    messages: [
      {
        role: "developer",
        content:
          "You are rewriting one section of a blog article for ShopReel. " +
          "Return JSON only. " +
          "Do not include instructions, labels, headings about the prompt, or meta commentary. " +
          "Write in a practical, conversational, industry-aware tone. " +
          "Avoid sounding like notes or summaries. " +
          "Keep the section cohesive with the rest of the article.",
      },
      {
        role: "user",
        content:
          `Topic: ${input.topic}\n` +
          `Section title: ${input.sectionTitle}\n` +
          `Blog style: ${input.blogStyle ?? "auto"}\n` +
          `Blog length mode: ${input.blogLengthMode ?? "standard"}\n` +
          `Audience: ${input.audience ?? "general audience"}\n` +
          `Summary: ${input.summary}\n` +
          `Hook: ${input.hook}\n` +
          `Context: ${input.context}\n` +
          `Explanation: ${input.explanation}\n` +
          `Takeaway: ${input.takeaway}\n` +
          `CTA: ${input.cta}\n` +
          `Current section body: ${input.existingBody}\n\n` +
          `All sections:\n${input.allSections
            .map((section) => `${section.title}: ${section.body}`)
            .join("\n\n")}\n\n` +
          "Rewrite only the requested section so it feels like finished article prose.",
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(text) as { body?: string };
    return clean(parsed.body ?? input.existingBody);
  } catch {
    return clean(input.existingBody);
  }
}
