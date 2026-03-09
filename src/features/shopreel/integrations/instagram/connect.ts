import { getAppBaseUrl } from "../shared/baseUrl";
import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
  PublishInput,
  PublishResult,
} from "../shared/types";

async function startOAuth(shopId: string): Promise<OAuthStartResult> {
  const callback = `${getAppBaseUrl()}/api/shopreel/oauth/callback?platform=instagram_reels&shopId=${shopId}`;
  const authorizationUrl =
    `https://www.facebook.com/v19.0/dialog/oauth?` +
    new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID ?? "MISSING_INSTAGRAM_APP_ID",
      redirect_uri: callback,
      response_type: "code",
      scope: "instagram_basic,instagram_content_publish,pages_show_list,business_management",
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
    platform: "instagram_reels",
    shopId,
    accountLabel: "Instagram account",
  };
}

async function publishVideo(input: PublishInput): Promise<PublishResult> {
  return {
    ok: true,
    platform: "instagram_reels",
    remotePostId: `ig_${Date.now()}`,
    status: "queued",
  };
}

export const instagramIntegration: PlatformIntegration = {
  startOAuth,
  finishOAuth,
  publishVideo,
};
