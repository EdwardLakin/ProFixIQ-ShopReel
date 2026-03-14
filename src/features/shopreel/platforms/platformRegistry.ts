export type PublishPayload = {
  videoUrl: string;
  caption?: string | null;
};

export type PlatformAdapter = {
  publish(payload: PublishPayload): Promise<{ externalId?: string }>;
};

export const platformRegistry: Record<string, PlatformAdapter> = {};


import { instagramAdapter } from "./instagramAdapter";

platformRegistry["instagram"] = instagramAdapter;
