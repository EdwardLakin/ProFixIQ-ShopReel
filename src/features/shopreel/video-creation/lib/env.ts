function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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
