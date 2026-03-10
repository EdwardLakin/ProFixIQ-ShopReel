import type { PublishInput, PublishResult } from "../shared/types";

export async function publishTikTokVideo(
  input: PublishInput,
): Promise<PublishResult> {
  throw new Error(
    `TikTok publishing is not wired yet for shop ${input.shopId}.`,
  );
}
