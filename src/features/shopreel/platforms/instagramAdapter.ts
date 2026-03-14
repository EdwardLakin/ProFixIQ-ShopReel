import type { PlatformAdapter } from "./platformRegistry";

export const instagramAdapter: PlatformAdapter = {
  async publish(payload) {
    console.log("Publishing to Instagram", payload);

    return {
      externalId: "instagram_mock_id",
    };
  },
};
