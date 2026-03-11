import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
  PublishResult,
} from "../shared/types";

export const linkedinIntegration: PlatformIntegration = {
  async startOAuth(): Promise<OAuthStartResult> {
    throw new Error("LinkedIn integration is not wired yet.");
  },

  async finishOAuth(): Promise<OAuthCallbackResult> {
    throw new Error("LinkedIn OAuth is not implemented yet.");
  },

  async publishVideo(): Promise<PublishResult> {
    return {
      ok: true,
      platform: "linkedin",
      remotePostId: `linkedin-draft-${Date.now()}`,
      remotePostUrl: null,
      status: "queued",
    };
  },
};
