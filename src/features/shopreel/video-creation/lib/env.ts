/**
 * Required env accessor for ShopReel video generation surfaces.
 * Throws explicit errors so API routes fail fast when setup is incomplete.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export type EnvHealth = "configured" | "partially_configured" | "unavailable";
export type MediaProviderMode = "direct" | "railway_legacy";

export function getMediaProviderMode(): MediaProviderMode {
  return process.env.SHOPREEL_MEDIA_PROVIDER_MODE === "railway_legacy" ? "railway_legacy" : "direct";
}

export function getVideoGenerationEnvHealth(): {
  state: EnvHealth;
  missing: string[];
} {
  const required = ["SHOPREEL_GENERATED_MEDIA_BUCKET"] as const;
  const optionalRailway = ["SHOPREEL_RAILWAY_VIDEO_BASE_URL", "SHOPREEL_RAILWAY_VIDEO_API_KEY"] as const;
  const missing: string[] = required.filter((key) => !process.env[key] || process.env[key]?.trim().length === 0);
  if (getMediaProviderMode() === "railway_legacy") {
    missing.push(...optionalRailway.filter((key) => !process.env[key] || process.env[key]?.trim().length === 0));
  }
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
