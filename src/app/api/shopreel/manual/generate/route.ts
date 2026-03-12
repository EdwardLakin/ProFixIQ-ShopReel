import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { createContentPieceFromManualAsset } from "@/features/shopreel/manual/lib/createOpportunityFromManualAsset";
import { createRenderJob } from "@/features/shopreel/render/createRenderJob";

type ManualGenerateBody = {
  assetId?: string | null;
  templateId?: string | null;
  createRenderJobNow?: boolean;
};

export async function POST(req: Request) {
  try {
    const shopId = await getCurrentShopId();
    const body = (await req.json().catch(() => ({}))) as ManualGenerateBody;

    if (!body.assetId) {
      return NextResponse.json(
        { ok: false, error: "assetId is required" },
        { status: 400 },
      );
    }

    const generated = await createContentPieceFromManualAsset({
      shopId,
      assetId: body.assetId,
      templateId: body.templateId ?? null,
    });

    const renderJob =
      body.createRenderJobNow
        ? await createRenderJob({
            shopId,
            contentPieceId: generated.contentPiece.id,
            sourceType: generated.storySource.kind,
            sourceId: generated.storySource.id,
            storySource: generated.storySource,
            storyDraft: generated.draft,
            renderPayload: {
              mode: "story_draft",
              title: generated.draft.title,
              hook: generated.draft.hook ?? null,
              caption: generated.draft.caption ?? null,
              cta: generated.draft.cta ?? null,
              scenes: generated.draft.scenes,
            },
          })
        : null;

    return NextResponse.json({
      ok: true,
      generated,
      renderJob,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate manual story";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
