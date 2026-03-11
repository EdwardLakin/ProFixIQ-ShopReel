import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getPlatformIntegration } from "@/features/shopreel/integrations/shared/platformRegistry";
import type { ShopReelPlatform } from "@/features/shopreel/integrations/shared/types";

type ShopMembershipRow = {
  shop_id: string;
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const oauthError =
      searchParams.get("error_message") ??
      searchParams.get("error_description") ??
      searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(
        `${BASE_URL}/shopreel/settings?oauth_error=${encodeURIComponent(oauthError)}`,
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

    const supabase = createAdminClient();

    const { data: membershipData, error: membershipError } = await (supabase as any)
      .from("shop_users")
      .select("shop_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const membership = membershipData as ShopMembershipRow | null;

    if (membershipError || !membership?.shop_id) {
      return NextResponse.redirect(
        `${BASE_URL}/shopreel/settings?oauth_error=${encodeURIComponent(
          "No active shop membership found.",
        )}`,
      );
    }

    const platform = normalizePlatform(platformParam);
    const integration = getPlatformIntegration(platform);

    await integration.finishOAuth(membership.shop_id, code);

    return NextResponse.redirect(`${BASE_URL}/shopreel/settings`);
  } catch (error) {
    return NextResponse.redirect(
      `${BASE_URL}/shopreel/settings?oauth_error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unexpected error",
      )}`,
    );
  }
}
