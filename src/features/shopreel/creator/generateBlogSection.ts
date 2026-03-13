import { openai } from "@/features/ai/server/openai";
import type { BlogLengthMode, BlogStyle } from "./buildCreatorOutputs";

export type BlogRewriteStyle =
  | "more_conversational"
  | "more_technical"
  | "more_storytelling"
  | "more_persuasive"
  | "shorter"
  | "expand"
  | "add_example"
  | "add_shop_floor_detail"
  | "stronger_hook"
  | "simpler_explanation"
  | "improve_writing";

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
  rewriteStyle?: BlogRewriteStyle | null;
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

function rewriteInstruction(style: BlogRewriteStyle | null | undefined) {
  switch (style) {
    case "more_conversational":
      return "Rewrite this section to sound more conversational and natural.";
    case "more_technical":
      return "Rewrite this section to sound a bit more technical and industry-specific without becoming robotic.";
    case "more_storytelling":
      return "Rewrite this section with stronger storytelling and a more vivid real-world feel.";
    case "more_persuasive":
      return "Rewrite this section to be more persuasive and compelling without sounding salesy.";
    case "shorter":
      return "Rewrite this section to be tighter and shorter while keeping the core meaning.";
    case "expand":
      return "Rewrite this section by expanding it with more useful detail and smoother explanation.";
    case "add_example":
      return "Rewrite this section and add one grounded real-world example.";
    case "add_shop_floor_detail":
      return "Rewrite this section and add concrete shop-floor detail that makes it feel lived-in and real.";
    case "stronger_hook":
      return "Rewrite this section with a stronger opening hook and better first sentence.";
    case "simpler_explanation":
      return "Rewrite this section so the explanation is simpler, clearer, and easier to follow.";
    case "improve_writing":
      return "Improve this section so it reads clearer, smoother, and more engaging without changing the meaning too much.";
    default:
      return "Rewrite only the requested section so it feels like finished article prose.";
  }
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
          `Rewrite mode: ${input.rewriteStyle ?? "default_regenerate"}\n` +
          `Instruction: ${rewriteInstruction(input.rewriteStyle)}\n` +
          `Current section body: ${input.existingBody}\n\n` +
          `All sections:\n${input.allSections
            .map((section) => `${section.title}: ${section.body}`)
            .join("\n\n")}\n\n` +
          rewriteInstruction(input.rewriteStyle),
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
