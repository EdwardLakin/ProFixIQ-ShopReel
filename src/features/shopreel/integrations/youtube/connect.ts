import { getAppBaseUrl } from "../shared/baseUrl";
import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
  PublishInput,
  PublishResult,
} from "../shared/types";

async function startOAuth(shopId: string): Promise<OAuthStartResult> {
  const callback = `${getAppBaseUrl()}/api/shopreel/oauth/callback?platform=youtube_shorts&shopId=${shopId}`;
  const authorizationUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "MISSING_GOOGLE_CLIENT_ID",
      redirect_uri: callback,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/youtube.upload",
      access_type: "offline",
      prompt: "consent",
      state: shopId,
    }).toString();

  return { ok: true, authorizationUrl };
}

async function finishOAuth(
  shopId: string,
  code: string,
): Promise<OAuthCallbackResult> {
  void code;
  return {
    ok: true,
    platform: "youtube_shorts",
    shopId,
    accountLabel: "YouTube channel",
  };
}

async function publishVideo(input: PublishInput): Promise<PublishResult> {
  return {
    ok: true,
    platform: "youtube_shorts",
    remotePostId: `yt_${Date.now()}`,
    status: "queued",
  };
}

export const youtubeIntegration: PlatformIntegration = {
  startOAuth,
  finishOAuth,
  publishVideo,
};
