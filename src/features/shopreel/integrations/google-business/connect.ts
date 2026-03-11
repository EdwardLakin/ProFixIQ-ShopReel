import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
  PublishResult,
} from "../shared/types";

export const googleBusinessIntegration: PlatformIntegration = {
  async startOAuth(): Promise<OAuthStartResult> {
    throw new Error("Google Business integration is not wired yet.");
  },

  async finishOAuth(): Promise<OAuthCallbackResult> {
    throw new Error("Google Business OAuth is not implemented yet.");
  },

  async publishVideo(): Promise<PublishResult> {
    return {
      ok: true,
      platform: "google_business",
      remotePostId: `google-business-draft-${Date.now()}`,
      remotePostUrl: null,
      status: "queued",
    };
  },
};
