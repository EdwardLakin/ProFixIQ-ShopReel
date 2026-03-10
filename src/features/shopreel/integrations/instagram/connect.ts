import { createAdminClient } from "@/lib/supabase/server";
import { buildOAuthCallbackUrl } from "../shared/baseUrl";
import { getMetaClientId, getMetaClientSecret } from "../shared/env";
import type {
  OAuthCallbackResult,
  OAuthStartResult,
  PlatformIntegration,
} from "../shared/types";

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

function buildInstagramScopes(): string {
  return [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");
}

async function exchangeMetaCodeForToken(code: string): Promise<MetaTokenResponse> {
  const redirectUri = buildOAuthCallbackUrl("instagram");

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token` +
      `?client_id=${encodeURIComponent(getMetaClientId())}` +
      `&client_secret=${encodeURIComponent(getMetaClientSecret())}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${encodeURIComponent(code)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const json = (await response.json().catch(() => ({}))) as MetaTokenResponse;

  if (!response.ok || !json.access_token) {
    throw new Error(
      json.error?.message ?? "Failed to exchange Meta OAuth code for Instagram token",
    );
  }

  return json;
}

async function fetchInstagramBusinessPage(accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts` +
      `?fields=id,name,access_token,instagram_business_account{id}` +
      `&access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const json = (await response.json().catch(() => ({}))) as MetaPagesResponse;
  const pages = Array.isArray(json.data) ? json.data : [];
  const pageWithIg =
    pages.find((page) => page.instagram_business_account?.id) ?? pages[0] ?? null;

  if (!response.ok || !pageWithIg) {
    throw new Error(
      json.error?.message ??
        "No Facebook Page was found for this Meta account. Instagram requires a connected Facebook Page.",
    );
  }

  if (!pageWithIg.instagram_business_account?.id) {
    throw new Error(
      "No Instagram Business account is linked to the selected Facebook Page.",
    );
  }

  return pageWithIg;
}

export const instagramIntegration: PlatformIntegration = {
  async startOAuth(_: string): Promise<OAuthStartResult> {
    const authorizationUrl =
      `https://www.facebook.com/v18.0/dialog/oauth` +
      `?client_id=${encodeURIComponent(getMetaClientId())}` +
      `&redirect_uri=${encodeURIComponent(buildOAuthCallbackUrl("instagram"))}` +
      `&scope=${encodeURIComponent(buildInstagramScopes())}` +
      `&response_type=code`;

    return {
      ok: true,
      authorizationUrl,
    };
  },

  async finishOAuth(shopId: string, code: string): Promise<OAuthCallbackResult> {
    const tokenData = await exchangeMetaCodeForToken(code);
    const accessToken = tokenData.access_token as string;
    const expiresIn =
      typeof tokenData.expires_in === "number" ? tokenData.expires_in : null;
    const tokenExpiresAt =
      expiresIn && expiresIn > 0
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null;

    const page = await fetchInstagramBusinessPage(accessToken);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("shopreel_social_connections")
      .upsert(
        {
          shop_id: shopId,
          platform: "instagram_reels",
          account_id: page.instagram_business_account?.id ?? null,
          account_name: page.name ?? "Instagram Business Account",
          access_token: accessToken,
          refresh_token: null,
          token_expires_at: tokenExpiresAt,
          connection_active: true,
          meta_page_id: page.id,
          meta_page_name: page.name ?? null,
          meta_instagram_business_id: page.instagram_business_account?.id ?? null,
          scopes: buildInstagramScopes().split(","),
          metadata_json: {
            oauth_platform: "instagram",
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "shop_id,platform",
        },
      );

    if (error) {
      throw new Error(error.message);
    }

    return {
      ok: true,
      platform: "instagram_reels",
      shopId,
      accountLabel: page.name ?? "Instagram Business Account",
    };
  },

  async publishVideo() {
    const mod = await import("./publish");
    return mod.publishInstagramVideo(arguments[0]);
  },
};
