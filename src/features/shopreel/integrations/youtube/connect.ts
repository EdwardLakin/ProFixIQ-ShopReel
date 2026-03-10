import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
} from "../shared/types";

export const youtubeIntegration: PlatformIntegration = {
  async startOAuth(): Promise<OAuthStartResult> {
    throw new Error("YouTube OAuth is not wired yet.");
  },

  async finishOAuth(shopId: string): Promise<OAuthCallbackResult> {
    throw new Error(`YouTube OAuth is not wired yet for shop ${shopId}.`);
  },

  async publishVideo() {
    const mod = await import("./publish");
    return mod.publishYouTubeShort(arguments[0]);
  },
};
