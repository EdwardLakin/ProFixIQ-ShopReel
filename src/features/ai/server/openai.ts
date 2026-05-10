import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

function resolveOpenAIKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return apiKey;
}

export function getOpenAIClient(): OpenAI {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new OpenAI({
    apiKey: resolveOpenAIKey(),
  });

  return cachedClient;
}

export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    const client = getOpenAIClient() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(client, prop, receiver);

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});
