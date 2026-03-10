function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAppUrl(): string {
  return required("APP_URL");
}

export function getMetaClientId(): string {
  return required("META_CLIENT_ID");
}

export function getMetaClientSecret(): string {
  return required("META_CLIENT_SECRET");
}

export function getTikTokClientId(): string {
  return required("TIKTOK_CLIENT_ID");
}

export function getTikTokClientSecret(): string {
  return required("TIKTOK_CLIENT_SECRET");
}

export function getYouTubeClientId(): string {
  return required("YOUTUBE_CLIENT_ID");
}

export function getYouTubeClientSecret(): string {
  return required("YOUTUBE_CLIENT_SECRET");
}
