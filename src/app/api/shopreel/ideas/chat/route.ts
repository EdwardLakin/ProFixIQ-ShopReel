import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/features/ai/server/openai";
import { SHOPREEL_AI_MODELS } from "@/features/shopreel/ai/modelConfig";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type IdeaAngle = {
  title: string;
  angle: string;
  hook: string;
  whyItWorks: string;
  suggestedCta: string;
};

type IdeasChatResponse = {
  reply: string;
  angles: IdeaAngle[];
  recommendedPrompt: string;
  followUpQuestions: string[];
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;

  return (
    (record.role === "user" || record.role === "assistant") &&
    typeof record.content === "string" &&
    record.content.trim().length > 0
  );
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isChatMessage).slice(-12);
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, 5);
}

function normalizeAngle(value: unknown, index: number): IdeaAngle | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  const title = stringValue(record.title, `Angle ${index + 1}`);
  const angle = stringValue(record.angle, "");
  const hook = stringValue(record.hook, "");
  const whyItWorks = stringValue(record.whyItWorks, "");
  const suggestedCta = stringValue(record.suggestedCta, "");

  if (!angle || !hook) return null;

  return {
    title,
    angle,
    hook,
    whyItWorks: whyItWorks || "This gives the audience a clear reason to care.",
    suggestedCta: suggestedCta || "Create this idea.",
  };
}

function normalizeResponse(value: unknown, fallbackPrompt: string): IdeasChatResponse {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

  const rawAngles = Array.isArray(record.angles) ? record.angles : [];
  const angles = rawAngles
    .map((item, index) => normalizeAngle(item, index))
    .filter((item): item is IdeaAngle => Boolean(item))
    .slice(0, 6);

  return {
    reply: stringValue(
      record.reply,
      "Here are a few strong ways to turn this into content.",
    ),
    angles,
    recommendedPrompt: stringValue(
      record.recommendedPrompt,
      fallbackPrompt,
    ),
    followUpQuestions: stringArray(record.followUpQuestions),
  };
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to brainstorm ideas." },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      idea?: unknown;
      messages?: unknown;
    };

    const idea = typeof body.idea === "string" ? body.idea.trim() : "";
    const messages = normalizeMessages(body.messages);

    const latestUserMessage =
      [...messages].reverse().find((message) => message.role === "user")?.content ??
      idea;

    if (!latestUserMessage.trim()) {
      return NextResponse.json(
        { ok: false, error: "Send an idea or question to brainstorm." },
        { status: 400 },
      );
    }

    const response = await openai.responses.create({
      model: SHOPREEL_AI_MODELS.text,
      input: [
        {
          role: "system",
          content:
            "You are ShopReel's AI brainstorming partner for creators, founders, brands, agencies, and small businesses. " +
            "Help users turn rough ideas into platform-ready content angles. " +
            "Be conversational, practical, specific, and premium. " +
            "Do not assume a repair-shop context unless the user provides it. " +
            "Return JSON only.",
        },
        {
          role: "user",
          content:
            "Brainstorm from this conversation. Give a helpful conversational reply, 4 to 6 content angles, a refined prompt that can be sent to the ShopReel Create flow, and 2 to 4 useful follow-up questions.\n\n" +
            JSON.stringify({ idea, messages }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "shopreel_ideas_chat",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              reply: { type: "string" },
              angles: {
                type: "array",
                minItems: 4,
                maxItems: 6,
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
              recommendedPrompt: { type: "string" },
              followUpQuestions: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["reply", "angles", "recommendedPrompt", "followUpQuestions"],
          },
        },
      },
    });

    const parsed = normalizeResponse(
      JSON.parse(response.output_text || "{}") as unknown,
      latestUserMessage,
    );

    return NextResponse.json({
      ok: true,
      result: parsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to brainstorm ideas.",
      },
      { status: 500 },
    );
  }
}
