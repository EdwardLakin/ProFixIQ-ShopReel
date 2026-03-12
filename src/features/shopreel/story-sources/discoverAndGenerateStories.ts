import { discoverStorySources } from "../discovery/discoverContent";
import { generateStoryPipeline } from "../story-builder";

export async function discoverAndGenerateStories(input: {
  shopId: string;
  limit?: number;
  createRenderJobs?: boolean;
  createdBy?: string | null;
}) {
  const sources = await discoverStorySources(input.shopId);
  const limitedSources = sources.slice(0, input.limit ?? 10);

  const results = [];

  for (const source of limitedSources) {
    const result = await generateStoryPipeline({
      shopId: input.shopId,
      source,
      sourceSystem: "shopreel",
      createRenderJobNow: input.createRenderJobs ?? false,
      createdBy: input.createdBy ?? null,
    });

    results.push(result);
  }

  return {
    count: results.length,
    results,
  };
}
