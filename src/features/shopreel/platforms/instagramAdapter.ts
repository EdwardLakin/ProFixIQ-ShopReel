import type { PlatformAdapter } from "./platformRegistry";

export const instagramAdapter: PlatformAdapter = {
  async publish(payload) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[mock-platform-adapter] Publishing to Instagram", payload);
    }

    return {
      externalId: `mock_instagram_unpublished_${Date.now()}`,
    };
  },
};
