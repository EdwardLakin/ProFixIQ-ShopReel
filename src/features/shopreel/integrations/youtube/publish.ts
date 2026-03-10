import type { PublishInput, PublishResult } from "../shared/types";

export async function publishYouTubeShort(
  input: PublishInput,
): Promise<PublishResult> {
  throw new Error(
    `YouTube publishing is not wired yet for shop ${input.shopId}.`,
  );
}
