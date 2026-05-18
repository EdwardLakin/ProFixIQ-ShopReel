import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { createPublicationBundle } from "@/features/shopreel/publishing/lib/createPublicationBundle";

export async function POST(_: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();

    const { data: item, error } = await (supabase as any)
      .from("shopreel_campaign_items")
      .select("id, shop_id, title, metadata")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (error || !item) {
      return NextResponse.json({ ok: false, error: "Campaign item not found" }, { status: 404 });
    }

    const metadata = item.metadata && typeof item.metadata === "object" ? item.metadata as Record<string, unknown> : {};
    const contentEventId = typeof metadata.content_event_id === "string" ? metadata.content_event_id : null;

    if (!contentEventId) {
      return NextResponse.json({ ok: false, error: "Connected accounts are available, but this post review item is not yet wired to a publishable content event." }, { status: 400 });
    }

    const targets: Array<"facebook" | "instagram"> = [];
    const { data: connections } = await (supabase as any)
      .from("content_platform_accounts")
      .select("platform, connection_active")
      .eq("tenant_shop_id", shopId)
      .eq("connection_active", true)
      .in("platform", ["facebook", "instagram"]);

    for (const row of connections ?? []) {
      if (row.platform === "facebook" || row.platform === "instagram") targets.push(row.platform);
    }

    if (targets.length === 0) {
      return NextResponse.json({ ok: false, error: "No connected Facebook/Instagram accounts." }, { status: 400 });
    }

    const bundles = await Promise.all(targets.map((platform) => createPublicationBundle({
      shopId,
      contentPieceId: item.id,
      contentEventId,
      platform,
      title: item.title,
      caption: null,
      enqueueNow: true,
    })));

    return NextResponse.json({ ok: true, publication: bundles[0]?.publication ?? null, jobs: bundles.map((entry) => entry.publishJob).filter(Boolean) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to queue publication" }, { status: 500 });
  }
}
