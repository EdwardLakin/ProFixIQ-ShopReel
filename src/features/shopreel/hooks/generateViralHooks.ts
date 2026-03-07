import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type HookResult = {
  hook: string;
  scorePredicted: number;
};

function fallbackHooks(subject: string): HookResult[] {
  return [
    { hook: `You would never guess what we found on this ${subject}.`, scorePredicted: 78 },
    { hook: `This ${subject} came in with a small issue. It was not small.`, scorePredicted: 81 },
    { hook: `Here’s what actually happened when this ${subject} hit the shop.`, scorePredicted: 76 },
    { hook: `Most drivers miss this warning sign until it gets expensive.`, scorePredicted: 84 },
    { hook: `This repair tells the whole story in under 30 seconds.`, scorePredicted: 73 },
  ];
}

export async function generateViralHooks(subject: string, contentType: string) {
  try {
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "Generate 5 strong short-form video hooks for an automotive repair shop. Return strict JSON only.",
        },
        {
          role: "user",
          content: `Subject: ${subject}\nContent type: ${contentType}\nReturn: [{"hook":"string","scorePredicted":0}]`,
        },
      ],
    });

    const raw = JSON.parse(response.output_text) as unknown;
    if (!Array.isArray(raw)) {
      return fallbackHooks(subject);
    }

    const hooks = raw
      .filter((row): row is { hook?: unknown; scorePredicted?: unknown } => typeof row === "object" && row !== null)
      .map((row) => ({
        hook: typeof row.hook === "string" ? row.hook : "Real work. Real findings. Real repairs.",
        scorePredicted:
          typeof row.scorePredicted === "number" ? row.scorePredicted : 70,
      }))
      .slice(0, 5);

    return hooks.length > 0 ? hooks : fallbackHooks(subject);
  } catch {
    return fallbackHooks(subject);
  }
}
