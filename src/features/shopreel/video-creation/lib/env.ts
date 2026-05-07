function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export type EnvHealth = "configured" | "partially_configured" | "unavailable";

export function getVideoGenerationEnvHealth(): {
  state: EnvHealth;
  missing: string[];
} {
  const required = [
    "SHOPREEL_RAILWAY_VIDEO_BASE_URL",
    "SHOPREEL_RAILWAY_VIDEO_API_KEY",
    "SHOPREEL_GENERATED_MEDIA_BUCKET",
  ] as const;
  const missing = required.filter((key) => !process.env[key] || process.env[key]?.trim().length === 0);
  if (missing.length === 0) return { state: "configured", missing: [] };
  if (missing.length === required.length) return { state: "unavailable", missing: [...missing] };
  return { state: "partially_configured", missing: [...missing] };
}

export function getOpenAIApiKey() {
  return requireEnv("OPENAI_API_KEY");
}

export function getGeneratedMediaBucket() {
  return requireEnv("SHOPREEL_GENERATED_MEDIA_BUCKET");
}

export function getRailwayVideoBaseUrl() {
  return requireEnv("SHOPREEL_RAILWAY_VIDEO_BASE_URL");
}

export function getRailwayVideoApiKey() {
  return requireEnv("SHOPREEL_RAILWAY_VIDEO_API_KEY");
}
