import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { getPlatformIntegration } from "@/features/shopreel/integrations/shared/platformRegistry";
import type { ShopReelPlatform } from "@/features/shopreel/integrations/shared/types";

type ShopMembershipRow = {
  shop_id: string | null;
};

type CallbackPlatformParam = "instagram" | "facebook" | "tiktok" | "youtube";

const BASE_URL = process.env.APP_URL!;

function normalizePlatform(platform: CallbackPlatformParam): ShopReelPlatform {
  switch (platform) {
    case "instagram":
      return "instagram";
    case "facebook":
      return "facebook";
    case "tiktok":
      return "tiktok";
    case "youtube":
      return "youtube";
  }
}

function settingsUrlWithMessage(params: {
  success?: string;
  error?: string;
}) {
  const url = new URL(`${BASE_URL}/shopreel/settings`);

  if (params.success) {
    url.searchParams.set("oauth_success", params.success);
  }

  if (params.error) {
    url.searchParams.set("oauth_error", params.error);
  }

  return url.toString();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const oauthError =
      searchParams.get("error_message") ??
      searchParams.get("error_description") ??
      searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(
        settingsUrlWithMessage({ error: oauthError }),
      );
    }

    const code = searchParams.get("code");
    const platformParam = searchParams.get("platform") as CallbackPlatformParam | null;

    if (!code || !platformParam) {
      return NextResponse.json(
        { error: "Missing OAuth parameters" },
        { status: 400 },
      );
    }

    if (
      platformParam !== "instagram" &&
      platformParam !== "facebook" &&
      platformParam !== "tiktok" &&
      platformParam !== "youtube"
    ) {
      return NextResponse.json(
        { error: "Unsupported platform" },
        { status: 400 },
      );
    }

    const appSupabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await appSupabase.auth.getUser();

    if (authError || !user) {
      const loginUrl = new URL(`${BASE_URL}/login`);
      loginUrl.searchParams.set("next", "/shopreel/settings");
      loginUrl.searchParams.set(
        "oauth_error",
        "Your session expired before the social account could be linked. Please sign in and try again.",
      );
      return NextResponse.redirect(loginUrl);
    }

    const admin = createAdminClient();

    let shopId: string | null = null;

    const { data: membershipData, error: membershipError } = await (admin as any)
      .from("shop_users")
      .select("shop_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const membership = (membershipData ?? null) as ShopMembershipRow | null;

    if (!membershipError && membership?.shop_id) {
      shopId = membership.shop_id;
    }

    if (!shopId) {
      shopId = await getCurrentShopId();
    }

    if (!shopId) {
      return NextResponse.redirect(
        settingsUrlWithMessage({
          error: "Unable to determine the active shop for this account.",
        }),
      );
    }

    const platform = normalizePlatform(platformParam);
    const integration = getPlatformIntegration(platform);

    const result = await integration.finishOAuth(shopId, code);

    return NextResponse.redirect(
      settingsUrlWithMessage({
        success: `${result.accountLabel ?? platform} connected successfully.`,
      }),
    );
  } catch (error) {
    return NextResponse.redirect(
      settingsUrlWithMessage({
        error:
          error instanceof Error ? error.message : "Unexpected error",
      }),
    );
  }
}
