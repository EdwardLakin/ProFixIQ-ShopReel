import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
  PublishResult,
} from "../shared/types";

export const blogIntegration: PlatformIntegration = {
  async startOAuth(): Promise<OAuthStartResult> {
    throw new Error("Blog publishing does not use OAuth yet.");
  },

  async finishOAuth(): Promise<OAuthCallbackResult> {
    throw new Error("Blog publishing OAuth is not implemented yet.");
  },

  async publishVideo(): Promise<PublishResult> {
    return {
      ok: true,
      platform: "blog",
      remotePostId: `blog-draft-${Date.now()}`,
      remotePostUrl: null,
      status: "queued",
    };
  },
};
