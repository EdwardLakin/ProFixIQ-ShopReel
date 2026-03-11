import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
} from "../shared/types";

export const linkedinIntegration: PlatformIntegration = {
  async startOAuth(_: string): Promise<OAuthStartResult> {
    throw new Error("LinkedIn OAuth is not implemented yet.");
  },

  async finishOAuth(shopId: string): Promise<OAuthCallbackResult> {
    return {
      ok: true,
      platform: "linkedin",
      shopId,
      accountLabel: "LinkedIn",
      platformAccountId: null,
    };
  },

  async publishVideo() {
    throw new Error("LinkedIn publishing is not implemented yet.");
  },
};
