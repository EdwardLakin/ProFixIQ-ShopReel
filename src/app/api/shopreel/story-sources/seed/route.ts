import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { generateStoryPipeline } from "@/features/shopreel/story-builder";
import type { StorySource } from "@/features/shopreel/story-sources";

type SeedBody = {
  createRenderJobNow?: boolean;
};

export async function POST(req: Request) {
  try {
    const shopId = await getCurrentShopId();
    const body = (await req.json().catch(() => ({}))) as SeedBody;

    const source: StorySource = {
      id: `seed:${Date.now()}`,
      shopId,
      title: "Brake inspection story",
      description: "Seeded ShopReel story source for pipeline testing.",
      kind: "inspection_completed",
      origin: "manual_upload",
      generationMode: "assisted",
      occurredAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null,
      projectId: null,
      projectName: null,
      vehicleLabel: "2020 Ford F-150",
      customerLabel: "Demo customer",
      technicianLabel: "Demo tech",
      tags: ["seed", "inspection", "brakes"],
      assets: [],
      refs: [],
      notes: [
        "Front pads worn low",
        "Rotor scoring visible",
        "Inspection completed and documented",
      ],
      facts: {
        hook: "Brake pads worn past spec — here’s what we found.",
        contentType: "inspection_highlight",
      },
      metadata: {
        seeded: true,
      },
    };

    const generated = await generateStoryPipeline({
      shopId,
      source,
      sourceSystem: "shopreel",
      createRenderJobNow: body.createRenderJobNow ?? false,
    });

    return NextResponse.json({
      ok: true,
      generated,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to seed story source";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
