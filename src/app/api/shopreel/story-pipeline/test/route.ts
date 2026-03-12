import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { discoverStorySources } from "@/features/shopreel/discovery/discoverContent";
import { generateStoryPipeline } from "@/features/shopreel/story-builder";

type Body = {
  createRenderJobNow?: boolean;
  limit?: number | null;
};

export async function POST(req: Request) {
  try {
    const shopId = await getCurrentShopId();
    const body = (await req.json().catch(() => ({}))) as Body;

    const sources = await discoverStorySources(shopId);
    const limited = sources.slice(0, body.limit ?? 1);

    if (limited.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No discoverable story sources found" },
        { status: 404 },
      );
    }

    const results = [];
    for (const source of limited) {
      const generated = await generateStoryPipeline({
        shopId,
        source,
        sourceSystem: "shopreel",
        createRenderJobNow: body.createRenderJobNow ?? false,
      });

      results.push({
        source: {
          id: generated.source.id,
          title: generated.source.title,
          kind: generated.source.kind,
          origin: generated.source.origin,
        },
        savedSource: generated.savedSource,
        contentPiece: {
          id: generated.contentPiece.id,
          title: generated.contentPiece.title,
          status: generated.contentPiece.status,
          content_type: generated.contentPiece.content_type,
        },
        renderJob: generated.renderJob
          ? {
              id: generated.renderJob.id,
              status: generated.renderJob.status,
            }
          : null,
        generation: generated.generation,
      });
    }

    return NextResponse.json({
      ok: true,
      count: results.length,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to test story pipeline";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
