import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
} from "../shared/types";

export const tiktokIntegration: PlatformIntegration = {
  async startOAuth(_: string): Promise<OAuthStartResult> {
    throw new Error("TikTok OAuth is not wired yet.");
  },

  async finishOAuth(shopId: string, _code: string): Promise<OAuthCallbackResult> {
    throw new Error(`TikTok OAuth is not wired yet for shop ${shopId}.`);
  },

  async publishVideo(input) {
    const mod = await import("./publish");
    return mod.publishTikTokVideo(input);
  },
};
