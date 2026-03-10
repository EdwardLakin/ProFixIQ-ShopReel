import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

const META_CLIENT_ID = process.env.META_CLIENT_ID!;
const META_CLIENT_SECRET = process.env.META_CLIENT_SECRET!;
const BASE_URL = process.env.APP_URL!;

type ShopMembershipRow = {
  shop_id: string;
};

type MetaTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

type MetaMeResponse = {
  id?: string;
  name?: string;
  error?: {
    message?: string;
  };
};

type MetaPagesResponse = {
  data?: Array<{
    id: string;
    name?: string;
    access_token?: string;
    instagram_business_account?: {
      id?: string;
    } | null;
  }>;
  error?: {
    message?: string;
  };
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const code = searchParams.get("code");
    const platform = searchParams.get("platform");

    if (!code || !platform) {
      return NextResponse.json(
        { error: "Missing OAuth parameters" },
        { status: 400 },
      );
    }

    if (platform !== "instagram" && platform !== "facebook") {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: membershipData, error: membershipError } = await supabase
      .from("shop_users")
      .select("shop_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const membership = membershipData as ShopMembershipRow | null;

    if (membershipError || !membership?.shop_id) {
      return NextResponse.json(
        { error: "No active shop membership found" },
        { status: 403 },
      );
    }

    const redirectUri = `${BASE_URL}/api/shopreel/oauth/callback?platform=${platform}`;

    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token` +
        `?client_id=${encodeURIComponent(META_CLIENT_ID)}` +
        `&client_secret=${encodeURIComponent(META_CLIENT_SECRET)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=${encodeURIComponent(code)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const tokenData = (await tokenRes.json().catch(() => ({}))) as MetaTokenResponse;

    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.json(
        {
          error:
            tokenData.error?.message ??
            "Failed to exchange Meta OAuth code for access token",
          meta: tokenData,
        },
        { status: 500 },
      );
    }

    const accessToken = tokenData.access_token;
    const expiresIn =
      typeof tokenData.expires_in === "number" ? tokenData.expires_in : null;
    const tokenExpiresAt =
      expiresIn && expiresIn > 0
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null;

    let accountId: string | null = null;
    let accountName: string | null = null;
    let metaPageId: string | null = null;
    let metaPageName: string | null = null;
    let metaInstagramBusinessId: string | null = null;

    if (platform === "facebook") {
      const meRes = await fetch(
        `https://graph.facebook.com/v18.0/me` +
          `?fields=id,name` +
          `&access_token=${encodeURIComponent(accessToken)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const meData = (await meRes.json().catch(() => ({}))) as MetaMeResponse;

      if (meRes.ok) {
        accountId = meData.id ?? null;
        accountName = meData.name ?? null;
      }

      const pagesRes = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts` +
          `?fields=id,name,access_token,instagram_business_account{id}` +
          `&access_token=${encodeURIComponent(accessToken)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const pagesData = (await pagesRes.json().catch(() => ({}))) as MetaPagesResponse;
      const firstPage = Array.isArray(pagesData.data) ? pagesData.data[0] : null;

      if (firstPage) {
        metaPageId = firstPage.id;
        metaPageName = firstPage.name ?? null;
      }
    }

    if (platform === "instagram") {
      const pagesRes = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts` +
          `?fields=id,name,access_token,instagram_business_account{id}` +
          `&access_token=${encodeURIComponent(accessToken)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const pagesData = (await pagesRes.json().catch(() => ({}))) as MetaPagesResponse;
      const pages = Array.isArray(pagesData.data) ? pagesData.data : [];

      const pageWithIg =
        pages.find((page) => page.instagram_business_account?.id) ?? pages[0] ?? null;

      if (!pageWithIg) {
        return NextResponse.json(
          {
            error:
              "No Facebook Page was found for this Meta account. Instagram publishing requires a connected Facebook Page.",
          },
          { status: 400 },
        );
      }

      metaPageId = pageWithIg.id;
      metaPageName = pageWithIg.name ?? null;
      metaInstagramBusinessId = pageWithIg.instagram_business_account?.id ?? null;

      if (!metaInstagramBusinessId) {
        return NextResponse.json(
          {
            error:
              "No Instagram Business account is linked to the selected Facebook Page.",
          },
          { status: 400 },
        );
      }

      accountId = metaInstagramBusinessId;
      accountName = metaPageName;
    }

    const normalizedPlatform =
      platform === "instagram" ? "instagram_reels" : "facebook";

    const metadataJson: Json = {
      oauth_platform: platform,
      connected_by_user_id: user.id,
    };

    const scopes: string[] = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ];

    const { error: upsertError } = await supabase
      .from("shopreel_social_connections")
      .upsert(
        {
          shop_id: membership.shop_id,
          platform: normalizedPlatform,
          account_id: accountId,
          account_name: accountName,
          access_token: accessToken,
          refresh_token: null,
          token_expires_at: tokenExpiresAt,
          connection_active: true,
          meta_page_id: metaPageId,
          meta_page_name: metaPageName,
          meta_instagram_business_id: metaInstagramBusinessId,
          scopes,
          metadata_json: metadataJson,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "shop_id,platform",
        },
      );

    if (upsertError) {
      return NextResponse.json(
        { error: upsertError.message },
        { status: 500 },
      );
    }

    return NextResponse.redirect(`${BASE_URL}/shopreel/settings`);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}