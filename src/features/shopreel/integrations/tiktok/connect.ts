import { getAppBaseUrl } from "../shared/baseUrl";
import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
  PublishInput,
  PublishResult,
} from "../shared/types";

async function startOAuth(shopId: string): Promise<OAuthStartResult> {
  const callback = `${getAppBaseUrl()}/api/shopreel/oauth/callback?platform=tiktok&shopId=${shopId}`;
  const authorizationUrl =
    `https://www.tiktok.com/v2/auth/authorize/?` +
    new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY ?? "MISSING_TIKTOK_CLIENT_KEY",
      redirect_uri: callback,
      response_type: "code",
      scope: "video.upload,video.publish,user.info.basic",
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
    platform: "tiktok",
    shopId,
    accountLabel: "TikTok account",
  };
}

async function publishVideo(input: PublishInput): Promise<PublishResult> {
  return {
    ok: true,
    platform: "tiktok",
    remotePostId: `tt_${Date.now()}`,
    status: "queued",
  };
}

export const tiktokIntegration: PlatformIntegration = {
  startOAuth,
  finishOAuth,
  publishVideo,
};
