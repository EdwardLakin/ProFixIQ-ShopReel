import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { saveStorySource } from "@/features/shopreel/story-sources/server/saveStorySource";
import { mapEventToStorySource } from "@/features/shopreel/integrations/profixiq/mapEventToStorySource";
import { upsertIngestedOpportunity } from "@/features/shopreel/integrations/profixiq/upsertIngestedOpportunity";
import { verifyProFixIQSignature } from "@/features/shopreel/integrations/profixiq/verifySignature";
import type { ProFixIQIngestPayload } from "@/features/shopreel/integrations/profixiq/types";

export const runtime = "nodejs";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePayload(payload: unknown): payload is ProFixIQIngestPayload {
  if (!payload || typeof payload !== "object") return false;

  const record = payload as Record<string, unknown>;

  return (
    isNonEmptyString(record.eventId) &&
    isNonEmptyString(record.eventType) &&
    typeof record.source === "object" &&
    record.source !== null &&
    isNonEmptyString((record.source as Record<string, unknown>).shopId)
  );
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-profixiq-signature");
    const timestamp = req.headers.get("x-profixiq-timestamp");
    const rawBody = await req.text();

    if (!signature || !timestamp) {
      return NextResponse.json(
        { ok: false, error: "Missing signature headers." },
        { status: 401 }
      );
    }

    const secret = process.env.PROFIXIQ_SHARED_SECRET;
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "Missing PROFIXIQ_SHARED_SECRET." },
        { status: 500 }
      );
    }

    const isValid = verifyProFixIQSignature({
      payload: rawBody,
      timestamp,
      signature,
      secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Invalid signature." },
        { status: 401 }
      );
    }

    const parsed: unknown = JSON.parse(rawBody);

    if (!validatePayload(parsed)) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload." },
        { status: 400 }
      );
    }

    const payload = parsed as ProFixIQIngestPayload;
    const tenantShopId = payload.destination?.remoteShopId?.trim();

    if (!tenantShopId) {
      return NextResponse.json(
        { ok: false, error: "Missing destination.remoteShopId." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: settings } = await supabase
      .from("shop_reel_settings")
      .select("shop_id")
      .eq("shop_id", tenantShopId)
      .maybeSingle();

    if (!settings?.shop_id) {
      return NextResponse.json(
        { ok: false, error: "Target ShopReel shop is not configured." },
        { status: 404 }
      );
    }

    const source = mapEventToStorySource({
      tenantShopId,
      payload,
    });

    const saved = await saveStorySource(source);

    await upsertIngestedOpportunity({
      tenantShopId,
      storySourceId: saved.id,
      eventType: payload.eventType,
      mediaCount: payload.storyData.media?.length ?? 0,
      metadata: {
        source_event_id: payload.eventId,
        source_event_type: payload.eventType,
        source_shop_id: payload.source.shopId,
        source_work_order_id: payload.subject.workOrderId ?? null,
        source_inspection_id: payload.subject.inspectionId ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      deduped: saved.deduped,
      storySourceId: saved.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to ingest ProFixIQ event.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
