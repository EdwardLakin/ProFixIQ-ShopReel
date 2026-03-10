import { getAppUrl } from "./env";

export function buildOAuthCallbackUrl(platform: string): string {
  return `${getAppUrl()}/api/shopreel/oauth/callback?platform=${encodeURIComponent(platform)}`;
}
