import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
  PublishResult,
} from "../shared/types";

export const emailIntegration: PlatformIntegration = {
  async startOAuth(): Promise<OAuthStartResult> {
    throw new Error("Email integration does not use OAuth yet.");
  },

  async finishOAuth(): Promise<OAuthCallbackResult> {
    throw new Error("Email integration OAuth is not implemented.");
  },

  async publishVideo(): Promise<PublishResult> {
    return {
      ok: true,
      platform: "email",
      remotePostId: `email-draft-${Date.now()}`,
      remotePostUrl: null,
      status: "queued",
    };
  },
};
