import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
} from "../shared/types";

export const blogIntegration: PlatformIntegration = {
  async startOAuth(_: string): Promise<OAuthStartResult> {
    throw new Error("Blog publishing does not use OAuth yet.");
  },

  async finishOAuth(shopId: string): Promise<OAuthCallbackResult> {
    return {
      ok: true,
      platform: "blog",
      shopId,
      accountLabel: "Blog publishing",
      platformAccountId: null,
    };
  },

  async publishVideo() {
    throw new Error("Blog publishing is not implemented yet.");
  },
};
