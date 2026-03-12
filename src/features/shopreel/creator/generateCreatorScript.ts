import { openai } from "@/features/ai/server/openai";

export type CreatorMode =
  | "research_script"
  | "angle_pack"
  | "debunk"
  | "stitch";

export type CreatorAngle = {
  title: string;
  angle: string;
  hook: string;
  whyItWorks: string;
  suggestedCta: string;
};

export type CreatorScriptInput = {
  mode?: CreatorMode;
  topic: string;
  audience?: string | null;
  tone?: string | null;
  platformFocus?: "instagram" | "tiktok" | "youtube" | "facebook" | "multi" | null;
  sourceText?: string | null;
  sourceUrl?: string | null;
};

export type CreatorScriptResult = {
  mode: CreatorMode;
  expandedTopic: string;
  hook: string;
  context: string;
  explanation: string;
  takeaway: string;
  cta: string;
  summary: string;
  bullets: string[];
  angles: CreatorAngle[];
};

function buildExpandedTopic(input: CreatorScriptInput): string {
  const base = input.topic.trim();

  if (!base) return "Creator topic";

  if (/iphone\s*18/i.test(base)) {
    return "iPhone 18 leaks, Apple hardware rumors, design changes, AI features, release expectations, and what appears credible so far";
  }

  if (/apple/i.test(base)) {
    return "Apple rumors, device leaks, feature expectations, launch timing, and what appears credible so far";
  }

  return base;
}

function fallbackAngles(input: CreatorScriptInput): CreatorAngle[] {
  const expanded = buildExpandedTopic(input);

  return [
    {
      title: "Fast rumor breakdown",
      angle: `Quick update on ${expanded}`,
      hook: `Here’s the latest on ${input.topic}.`,
      whyItWorks: "Fast, broad, easy to publish.",
      suggestedCta: "Follow for the next update.",
    },
    {
      title: "What looks credible",
      angle: `Separate strong signals from weak rumors around ${expanded}`,
      hook: `Not every rumor about ${input.topic} is real — here’s what actually looks credible.`,
      whyItWorks: "Trust-building, informative, strong retention.",
      suggestedCta: "Comment which rumor you think is real.",
    },
    {
      title: "Why this matters",
      angle: `Explain why ${expanded} matters for buyers or viewers`,
      hook: `Here’s why these ${input.topic} rumors actually matter.`,
      whyItWorks: "Useful angle with broader appeal.",
      suggestedCta: "Save this for later.",
    },
    {
      title: "Debunk the wild claims",
      angle: `Push back on exaggerated claims around ${expanded}`,
      hook: `Some of the rumors around ${input.topic} are getting out of hand.`,
      whyItWorks: "High engagement and corrective framing.",
      suggestedCta: "Send me the wildest rumor you’ve seen.",
    },
  ];
}

function fallbackCreatorScript(input: CreatorScriptInput): CreatorScriptResult {
  const topic = input.topic.trim();
  const mode = input.mode ?? "research_script";
  const expandedTopic = buildExpandedTopic(input);
  const angles = fallbackAngles(input);

  if (mode === "debunk") {
    return {
      mode,
      expandedTopic,
      hook: `A lot of people are saying this about ${topic} — but that claim does not really hold up.`,
      context: input.sourceText?.trim() || `This rumor is spreading quickly around ${topic}.`,
      explanation: "The strongest parts of the claim are weak, missing context, or unsupported.",
      takeaway: "The better move is to separate attention-grabbing rumor from what can actually be supported.",
      cta: "Send me more claims to fact-check.",
      summary: `Debunk-style creator script for ${topic}.`,
      bullets: [
        `Main claim circulating about ${topic}`,
        "Where the claim becomes weak or unsupported",
        "What viewers should believe instead",
      ],
      angles,
    };
  }

  if (mode === "stitch") {
    return {
      mode,
      expandedTopic,
      hook: `I saw a take about ${topic}, and here’s my response.`,
      context: input.sourceText?.trim() || `This is the original claim or talking point around ${topic}.`,
      explanation: "Here is the part that deserves a direct response, correction, or better context.",
      takeaway: "A strong stitch does not just react — it improves the conversation.",
      cta: "Drop another take you want me to respond to.",
      summary: `Stitch-response creator script for ${topic}.`,
      bullets: [
        `Original take about ${topic}`,
        "Best response angle",
        "Why the response is worth posting",
      ],
      angles,
    };
  }

  return {
    mode,
    expandedTopic,
    hook: `${topic} — here’s what you need to know.`,
    context: `Here is the main conversation happening around ${expandedTopic}.`,
    explanation: "Here is what looks credible, what still sounds uncertain, and what people should pay attention to.",
    takeaway: "The real takeaway is what changes for the viewer, buyer, or follower.",
    cta: "Follow for more updates, and check back for the next breakdown.",
    summary: `Fast breakdown of ${expandedTopic} for short-form creator content.`,
    bullets: [
      `What people are saying about ${expandedTopic}`,
      "Which claims appear strongest right now",
      "Why this matters for viewers",
    ],
    angles,
  };
}

function safeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function safeBullets(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;

  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);

  return cleaned.length > 0 ? cleaned : fallback;
}

function safeAngles(value: unknown, fallback: CreatorAngle[]): CreatorAngle[] {
  if (!Array.isArray(value)) return fallback;

  const cleaned = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;

      return {
        title: safeString(record.title, ""),
        angle: safeString(record.angle, ""),
        hook: safeString(record.hook, ""),
        whyItWorks: safeString(record.whyItWorks, ""),
        suggestedCta: safeString(record.suggestedCta, ""),
      };
    })
    .filter(
      (item): item is CreatorAngle =>
        !!item &&
        !!item.title &&
        !!item.angle &&
        !!item.hook &&
        !!item.whyItWorks &&
        !!item.suggestedCta,
    )
    .slice(0, 8);

  return cleaned.length > 0 ? cleaned : fallback;
}

export async function generateCreatorScript(
  input: CreatorScriptInput,
): Promise<CreatorScriptResult> {
  const normalized: CreatorScriptInput = {
    ...input,
    mode: input.mode ?? "research_script",
  };

  const fallback = fallbackCreatorScript(normalized);

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.7,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "creator_script_expansion",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            mode: {
              type: "string",
              enum: ["research_script", "angle_pack", "debunk", "stitch"],
            },
            expandedTopic: { type: "string" },
            hook: { type: "string" },
            context: { type: "string" },
            explanation: { type: "string" },
            takeaway: { type: "string" },
            cta: { type: "string" },
            summary: { type: "string" },
            bullets: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 6,
            },
            angles: {
              type: "array",
              minItems: 4,
              maxItems: 8,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  angle: { type: "string" },
                  hook: { type: "string" },
                  whyItWorks: { type: "string" },
                  suggestedCta: { type: "string" },
                },
                required: ["title", "angle", "hook", "whyItWorks", "suggestedCta"],
              },
            },
          },
          required: [
            "mode",
            "expandedTopic",
            "hook",
            "context",
            "explanation",
            "takeaway",
            "cta",
            "summary",
            "bullets",
            "angles",
          ],
        },
      },
    },
    messages: [
      {
        role: "developer",
        content:
          "You are a short-form creator strategist and script writer. " +
          "Expand narrow prompts into broader content territory when useful. " +
          "Always return valid JSON only. " +
          "You generate a speaking hook, context, explanation, takeaway, CTA, research bullets, and multiple post angles. " +
          "For debunk mode, focus on correction and evidence framing. " +
          "For stitch mode, focus on direct response framing. " +
          "Keep lines concise, natural, and creator-friendly.",
      },
      {
        role: "user",
        content:
          `Mode: ${normalized.mode}\n` +
          `Topic: ${normalized.topic}\n` +
          `Audience: ${normalized.audience ?? "general audience"}\n` +
          `Tone: ${normalized.tone ?? "confident"}\n` +
          `Platform focus: ${normalized.platformFocus ?? "multi"}\n` +
          `Source text: ${normalized.sourceText ?? "none"}\n` +
          `Source URL: ${normalized.sourceUrl ?? "none"}\n\n` +
          "Do all of the following:\n" +
          "1. Expand the topic into the broader information space a creator should care about.\n" +
          "2. Write a 5-scene creator script.\n" +
          "3. Provide 3 to 6 research bullets.\n" +
          "4. Provide 4 to 8 different post angles that could each become separate posts.\n" +
          "5. Make the output useful for creator mode inside a video editor.\n",
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;

    return {
      mode:
        parsed.mode === "research_script" ||
        parsed.mode === "angle_pack" ||
        parsed.mode === "debunk" ||
        parsed.mode === "stitch"
          ? parsed.mode
          : fallback.mode,
      expandedTopic: safeString(parsed.expandedTopic, fallback.expandedTopic),
      hook: safeString(parsed.hook, fallback.hook),
      context: safeString(parsed.context, fallback.context),
      explanation: safeString(parsed.explanation, fallback.explanation),
      takeaway: safeString(parsed.takeaway, fallback.takeaway),
      cta: safeString(parsed.cta, fallback.cta),
      summary: safeString(parsed.summary, fallback.summary),
      bullets: safeBullets(parsed.bullets, fallback.bullets),
      angles: safeAngles(parsed.angles, fallback.angles),
    };
  } catch {
    return fallback;
  }
}
