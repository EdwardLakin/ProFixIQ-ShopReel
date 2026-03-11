import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

type ConnectionRow = {
  id: string;
  platform: "instagram" | "facebook" | "tiktok" | "youtube";
  platform_account_id: string | null;
  platform_username: string | null;
  connection_active: boolean;
  token_expires_at: string | null;
  metadata: Json;
  updated_at: string;
};

function getMetadataLabel(metadata: Json): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const record = metadata as Record<string, unknown>;

  const candidates = [
    record.meta_page_name,
    record.meta_user_name,
    record.channel_title,
    record.account_name,
    record.username,
    record.handle,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

async function resolveShopId(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return DEFAULT_SHOP_ID;
  }

  const { data, error } = await supabase.rpc("current_tenant_shop_id");

  if (error || !data) {
    return DEFAULT_SHOP_ID;
  }

  return String(data);
}

export async function GET() {
  try {
    const shopId = await resolveShopId();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("content_platform_accounts")
      .select(
        "id, platform, platform_account_id, platform_username, connection_active, token_expires_at, metadata, updated_at",
      )
      .eq("tenant_shop_id", shopId)
      .in("platform", ["instagram", "facebook", "tiktok", "youtube"])
      .order("platform", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    const rows = (data ?? []) as ConnectionRow[];

    const connections = rows.map((row) => ({
      id: row.id,
      platform:
        row.platform === "instagram"
          ? "instagram_reels"
          : row.platform === "youtube"
            ? "youtube_shorts"
            : row.platform,
      connection_active: row.connection_active,
      token_expires_at: row.token_expires_at,
      platform_account_id: row.platform_account_id,
      platform_username: row.platform_username,
      account_label:
        row.platform_username ??
        getMetadataLabel(row.metadata) ??
        row.platform_account_id ??
        null,
      metadata: row.metadata,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({
      ok: true,
      connections,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
