import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

type ConnectionRow = {
  id: string;
  platform:
    | "instagram"
    | "facebook"
    | "youtube"
    | "tiktok"
    | "blog"
    | "linkedin"
    | "google_business"
    | "email";
  connection_active: boolean;
  platform_account_id: string | null;
  platform_username: string | null;
  token_expires_at: string | null;
  updated_at: string | null;
  metadata: unknown;
};

export async function GET() {
  try {
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("content_platform_accounts")
      .select(
        "id, platform, connection_active, platform_account_id, platform_username, token_expires_at, updated_at, metadata",
      )
      .eq("tenant_shop_id", shopId)
      .order("platform", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    const connections = ((data ?? []) as ConnectionRow[]).map((row) => {
      const metadata =
        row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : {};

      const accountLabel =
        typeof metadata.meta_page_name === "string"
          ? metadata.meta_page_name
          : row.platform_username ?? row.platform_account_id ?? null;

      return {
        ...row,
        account_label: accountLabel,
        metadata,
      };
    });

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
