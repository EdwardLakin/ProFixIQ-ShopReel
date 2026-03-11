import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
} from "../shared/types";

export const emailIntegration: PlatformIntegration = {
  async startOAuth(_: string): Promise<OAuthStartResult> {
    throw new Error("Email publishing does not use OAuth yet.");
  },

  async finishOAuth(shopId: string): Promise<OAuthCallbackResult> {
    return {
      ok: true,
      platform: "email",
      shopId,
      accountLabel: "Email publishing",
      platformAccountId: null,
    };
  },

  async publishVideo() {
    throw new Error("Email publishing is not implemented yet.");
  },
};
