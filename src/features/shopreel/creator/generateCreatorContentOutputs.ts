import { openai } from "@/features/ai/server/openai";
import type {
  BlogLengthMode,
  BlogStyle,
  CreatorTextOutputs,
} from "./buildCreatorOutputs";

type Input = {
  topic: string;
  summary: string;
  bullets: string[];
  hook: string;
  context: string;
  explanation: string;
  takeaway: string;
  cta: string;
  angleTitle?: string | null;
  angleDescription?: string | null;
  audience?: string | null;
  blogStyle?: BlogStyle;
  blogLengthMode?: BlogLengthMode;
};

type GeneratedShape = {
  blog: CreatorTextOutputs["blog"];
  email: CreatorTextOutputs["email"];
  post: CreatorTextOutputs["post"];
  vlog: CreatorTextOutputs["vlog"];
};

function cleanText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return stripInstructionLeakage(value.trim()) || fallback;
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => stripInstructionLeakage(item.trim()))
    .filter(Boolean);
}

function stripInstructionLeakage(input: string): string {
  let text = input;

  const bannedPatterns = [
    /SYSTEM INSTRUCTIONS[\s\S]*/gi,
    /ARTICLE TOPIC[\s\S]*/gi,
    /^Topic:\s.*$/gim,
    /^Instructions:\s.*$/gim,
    /^Structure:\s.*$/gim,
    /^Only output.*$/gim,
    /^Do not include.*$/gim,
    /^Guidelines:\s*$/gim,
    /^Write a conversational blog article.*$/gim,
    /^Current system pipeline:.*$/gim,
    /^The generator must never output.*$/gim,
    /^Below are the required improvements\..*$/gim,
    /^\d+\.\s.*$/gim,
    /^-\s.*$/gim,
    /^---$/gim,
  ];

  for (const pattern of bannedPatterns) {
    text = text.replace(pattern, "");
  }

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeStyle(
  style: unknown,
  fallback: Exclude<BlogStyle, "auto">,
): Exclude<BlogStyle, "auto"> {
  if (
    style === "story_driven" ||
    style === "educational" ||
    style === "opinion" ||
    style === "case_study" ||
    style === "problem_solution"
  ) {
    return style;
  }
  return fallback;
}

function normalizeLengthMode(
  value: unknown,
  fallback: BlogLengthMode,
): BlogLengthMode {
  if (value === "short" || value === "standard" || value === "long") return value;
  return fallback;
}

function normalizeSections(value: unknown, fallback: CreatorTextOutputs["blog"]["sections"]) {
  if (!Array.isArray(value)) return fallback;

  const sections = value
    .map((section, index) => {
      if (!section || typeof section !== "object" || Array.isArray(section)) return null;
      const record = section as Record<string, unknown>;

      const title = cleanText(record.title, `Section ${index + 1}`);
      const body = cleanText(record.body, "");

      if (!body) return null;

      return {
        key:
          typeof record.key === "string" && record.key.trim().length > 0
            ? record.key.trim()
            : `section_${index + 1}`,
        title,
        body,
      };
    })
    .filter(
      (section): section is { key: string; title: string; body: string } => !!section,
    );

  return sections.length > 0 ? sections : fallback;
}

function deterministicStyle(input: Input): Exclude<BlogStyle, "auto"> {
  if (
    input.blogStyle &&
    input.blogStyle !== "auto" &&
    input.blogStyle !== undefined
  ) {
    return input.blogStyle;
  }

  const seed = `${input.topic}:${input.angleTitle ?? ""}:${input.angleDescription ?? ""}`;
  const total = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const styles: Array<Exclude<BlogStyle, "auto">> = [
    "story_driven",
    "educational",
    "opinion",
    "case_study",
    "problem_solution",
  ];

  return styles[total % styles.length] ?? "story_driven";
}

function fallbackOutputs(input: Input): GeneratedShape {
  const style = deterministicStyle(input);
  const lengthMode = input.blogLengthMode ?? "standard";
  const title = (input.angleTitle ?? input.topic).trim() || "Generated blog";
  const intro =
    style === "story_driven"
      ? `Picture a technician finishing a job, wiping their hands, and then walking back to a computer that slows everything down. That is what this topic really comes back to: ${input.summary}`
      : `${input.summary} ${input.context}`.trim();

  const blogSections: CreatorTextOutputs["blog"]["sections"] = [
    {
      key: "intro",
      title: "Intro",
      body: intro,
    },
    {
      key: "section_1",
      title: "What is happening",
      body: input.context,
    },
    {
      key: "section_2",
      title: "Why it matters",
      body: input.explanation,
    },
    {
      key: "section_3",
      title: "The takeaway",
      body: input.takeaway,
    },
    {
      key: "cta",
      title: "Conclusion",
      body: input.cta,
    },
  ];

  return {
    blog: {
      title,
      style,
      lengthMode,
      body: blogSections.map((section, index) => {
        if (index === 0) return section.body;
        return `## ${section.title}\n\n${section.body}`;
      }).join("\n\n"),
      sections: blogSections,
    },
    email: {
      subject: title,
      body: [input.hook, input.summary, input.explanation, input.cta]
        .filter(Boolean)
        .join("\n\n"),
      sections: [
        { key: "intro", title: "Intro", body: input.hook },
        { key: "section_1", title: "Main point", body: input.summary },
        { key: "section_2", title: "Details", body: input.explanation },
        { key: "cta", title: "Closing", body: input.cta },
      ],
    },
    post: {
      title,
      body: [input.hook, input.angleDescription ?? input.summary, input.takeaway, input.cta]
        .filter(Boolean)
        .join("\n\n"),
      sections: [
        { key: "hook", title: "Hook", body: input.hook },
        {
          key: "body",
          title: "Body",
          body: [input.angleDescription ?? "", input.summary, input.takeaway]
            .filter(Boolean)
            .join(" "),
        },
        { key: "cta", title: "CTA", body: input.cta },
      ],
    },
    vlog: {
      title,
      hook: input.hook,
      talkingPoints: [input.summary, input.context, input.explanation, input.takeaway]
        .filter(Boolean)
        .slice(0, 5),
      bRoll: [
        "Opening talking-head shot",
        "Relevant shop floor detail shots",
        "Process footage",
        "Finished result or supporting visual",
      ],
      sceneOrder: [
        { title: "Hook", description: input.hook, durationLabel: "0-5s" },
        { title: "Scene 1", description: input.context, durationLabel: "5-20s" },
        { title: "Scene 2", description: input.explanation, durationLabel: "20-40s" },
        { title: "Scene 3", description: input.takeaway, durationLabel: "40-55s" },
        { title: "Closing CTA", description: input.cta, durationLabel: "55-60s" },
      ],
      closingCta: input.cta,
      script: [input.hook, input.context, input.explanation, input.takeaway, input.cta]
        .filter(Boolean)
        .join("\n\n"),
    },
  };
}

export async function generateCreatorContentOutputs(
  input: Input,
): Promise<CreatorTextOutputs> {
  const fallback = fallbackOutputs(input);
  const style = deterministicStyle(input);
  const lengthMode = input.blogLengthMode ?? "standard";

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.9,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "creator_content_outputs",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            blog: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                style: {
                  type: "string",
                  enum: [
                    "story_driven",
                    "educational",
                    "opinion",
                    "case_study",
                    "problem_solution",
                  ],
                },
                lengthMode: {
                  type: "string",
                  enum: ["short", "standard", "long"],
                },
                body: { type: "string" },
                sections: {
                  type: "array",
                  minItems: 5,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      key: { type: "string" },
                      title: { type: "string" },
                      body: { type: "string" },
                    },
                    required: ["key", "title", "body"],
                  },
                },
              },
              required: ["title", "style", "lengthMode", "body", "sections"],
            },
            email: {
              type: "object",
              additionalProperties: false,
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
                sections: {
                  type: "array",
                  minItems: 3,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      key: { type: "string" },
                      title: { type: "string" },
                      body: { type: "string" },
                    },
                    required: ["key", "title", "body"],
                  },
                },
              },
              required: ["subject", "body", "sections"],
            },
            post: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                body: { type: "string" },
                sections: {
                  type: "array",
                  minItems: 3,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      key: { type: "string" },
                      title: { type: "string" },
                      body: { type: "string" },
                    },
                    required: ["key", "title", "body"],
                  },
                },
              },
              required: ["title", "body", "sections"],
            },
            vlog: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                hook: { type: "string" },
                talkingPoints: {
                  type: "array",
                  minItems: 4,
                  maxItems: 6,
                  items: { type: "string" },
                },
                bRoll: {
                  type: "array",
                  minItems: 4,
                  maxItems: 8,
                  items: { type: "string" },
                },
                sceneOrder: {
                  type: "array",
                  minItems: 5,
                  maxItems: 7,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      durationLabel: { type: "string" },
                    },
                    required: ["title", "description", "durationLabel"],
                  },
                },
                closingCta: { type: "string" },
                script: { type: "string" },
              },
              required: [
                "title",
                "hook",
                "talkingPoints",
                "bRoll",
                "sceneOrder",
                "closingCta",
                "script",
              ],
            },
          },
          required: ["blog", "email", "post", "vlog"],
        },
      },
    },
    messages: [
      {
        role: "developer",
        content:
          "You are a content engine for ShopReel. " +
          "Return JSON only. " +
          "Never include prompt instructions, topic labels, structure notes, or meta commentary in the output text. " +
          "The final text must read like finished content, not notes. " +
          "For blog output, write a real article in a conversational, practical, industry-aware voice. " +
          "Avoid corporate buzzwords, fake statistics, and robotic phrasing. " +
          "Use real-world scenarios and natural transitions. " +
          "For the blog, sections must be editable chunks: Title, Intro, Section 1, Section 2, Section 3, Conclusion or CTA. " +
          "For vlog, produce a creator-ready script with hook, talking points, suggested b-roll, scene order, and closing CTA. " +
          "Email and social post outputs should also feel publish-ready.",
      },
      {
        role: "user",
        content:
          `Topic: ${input.topic}\n` +
          `Angle title: ${input.angleTitle ?? "none"}\n` +
          `Angle description: ${input.angleDescription ?? "none"}\n` +
          `Audience: ${input.audience ?? "general audience"}\n` +
          `Blog style: ${style}\n` +
          `Blog length mode: ${lengthMode}\n` +
          `Hook: ${input.hook}\n` +
          `Summary: ${input.summary}\n` +
          `Context: ${input.context}\n` +
          `Explanation: ${input.explanation}\n` +
          `Takeaway: ${input.takeaway}\n` +
          `CTA: ${input.cta}\n` +
          `Bullets: ${input.bullets.join(" | ")}\n\n` +
          "Produce all of the following:\n" +
          "1. A publish-ready blog article with editable sections.\n" +
          "2. A publish-ready email draft with editable sections.\n" +
          "3. A publish-ready social post with editable sections.\n" +
          "4. A creator-ready vlog package.\n\n" +
          "Important blog rules:\n" +
          "- Output only article text, never instructions.\n" +
          "- Write like someone who understands the industry.\n" +
          "- Use natural storytelling when appropriate.\n" +
          "- Keep it readable and human, not summary-like.\n" +
          "- Respect the requested style and length mode.\n",
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const blog = (parsed.blog ?? {}) as Record<string, unknown>;
    const email = (parsed.email ?? {}) as Record<string, unknown>;
    const post = (parsed.post ?? {}) as Record<string, unknown>;
    const vlog = (parsed.vlog ?? {}) as Record<string, unknown>;

    return {
      blog: {
        title: cleanText(blog.title, fallback.blog.title),
        style: normalizeStyle(blog.style, fallback.blog.style),
        lengthMode: normalizeLengthMode(blog.lengthMode, fallback.blog.lengthMode),
        body: cleanText(blog.body, fallback.blog.body),
        sections: normalizeSections(blog.sections, fallback.blog.sections),
      },
      email: {
        subject: cleanText(email.subject, fallback.email.subject),
        body: cleanText(email.body, fallback.email.body),
        sections: normalizeSections(email.sections, fallback.email.sections),
      },
      post: {
        title: cleanText(post.title, fallback.post.title),
        body: cleanText(post.body, fallback.post.body),
        sections: normalizeSections(post.sections, fallback.post.sections),
      },
      vlog: {
        title: cleanText(vlog.title, fallback.vlog.title),
        hook: cleanText(vlog.hook, fallback.vlog.hook),
        talkingPoints: cleanStringArray(vlog.talkingPoints).length > 0
          ? cleanStringArray(vlog.talkingPoints)
          : fallback.vlog.talkingPoints,
        bRoll: cleanStringArray(vlog.bRoll).length > 0
          ? cleanStringArray(vlog.bRoll)
          : fallback.vlog.bRoll,
        sceneOrder:
          Array.isArray(vlog.sceneOrder) && vlog.sceneOrder.length > 0
            ? vlog.sceneOrder
                .map((scene, index) => {
                  if (!scene || typeof scene !== "object" || Array.isArray(scene)) return null;
                  const record = scene as Record<string, unknown>;
                  return {
                    title: cleanText(record.title, `Scene ${index + 1}`),
                    description: cleanText(record.description, ""),
                    durationLabel: cleanText(record.durationLabel, ""),
                  };
                })
                .filter(
                  (
                    scene,
                  ): scene is {
                    title: string;
                    description: string;
                    durationLabel: string;
                  } => !!scene && !!scene.description,
                )
            : fallback.vlog.sceneOrder,
        closingCta: cleanText(vlog.closingCta, fallback.vlog.closingCta),
        script: cleanText(vlog.script, fallback.vlog.script),
      },
    };
  } catch {
    return fallback;
  }
}
