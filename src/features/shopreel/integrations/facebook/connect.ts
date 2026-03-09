import { getAppBaseUrl } from "../shared/baseUrl";
import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
  PublishInput,
  PublishResult,
} from "../shared/types";

async function startOAuth(shopId: string): Promise<OAuthStartResult> {
  const callback = `${getAppBaseUrl()}/api/shopreel/oauth/callback?platform=facebook&shopId=${shopId}`;
  const authorizationUrl =
    `https://www.facebook.com/v19.0/dialog/oauth?` +
    new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID ?? "MISSING_FACEBOOK_APP_ID",
      redirect_uri: callback,
      response_type: "code",
      scope: "pages_manage_posts,pages_read_engagement,business_management",
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
    platform: "facebook",
    shopId,
    accountLabel: "Facebook page",
  };
}

async function publishVideo(input: PublishInput): Promise<PublishResult> {
  return {
    ok: true,
    platform: "facebook",
    remotePostId: `fb_${Date.now()}`,
    status: "queued",
  };
}

export const facebookIntegration: PlatformIntegration = {
  startOAuth,
  finishOAuth,
  publishVideo,
};
