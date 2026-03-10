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

function buildFacebookScopes(): string {
  return [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
  ].join(",");
}

async function exchangeMetaCodeForToken(code: string): Promise<MetaTokenResponse> {
  const redirectUri = buildOAuthCallbackUrl("facebook");

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
      json.error?.message ?? "Failed to exchange Meta OAuth code for Facebook token",
    );
  }

  return json;
}

export const facebookIntegration: PlatformIntegration = {
  async startOAuth(_: string): Promise<OAuthStartResult> {
    const authorizationUrl =
      `https://www.facebook.com/v18.0/dialog/oauth` +
      `?client_id=${encodeURIComponent(getMetaClientId())}` +
      `&redirect_uri=${encodeURIComponent(buildOAuthCallbackUrl("facebook"))}` +
      `&scope=${encodeURIComponent(buildFacebookScopes())}` +
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

    const meRes = await fetch(
      `https://graph.facebook.com/v18.0/me` +
        `?fields=id,name` +
        `&access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const meJson = (await meRes.json().catch(() => ({}))) as MetaMeResponse;

    if (!meRes.ok || !meJson.id) {
      throw new Error(meJson.error?.message ?? "Failed to fetch Facebook account.");
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

    const pagesJson = (await pagesRes.json().catch(() => ({}))) as MetaPagesResponse;
    const firstPage = Array.isArray(pagesJson.data) ? pagesJson.data[0] : null;

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("shopreel_social_connections")
      .upsert(
        {
          shop_id: shopId,
          platform: "facebook",
          account_id: meJson.id,
          account_name: meJson.name ?? "Facebook Account",
          access_token: accessToken,
          refresh_token: null,
          token_expires_at: tokenExpiresAt,
          connection_active: true,
          meta_page_id: firstPage?.id ?? null,
          meta_page_name: firstPage?.name ?? null,
          meta_instagram_business_id:
            firstPage?.instagram_business_account?.id ?? null,
          scopes: buildFacebookScopes().split(","),
          metadata_json: {
            oauth_platform: "facebook",
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
      platform: "facebook",
      shopId,
      accountLabel: meJson.name ?? "Facebook Account",
    };
  },

  async publishVideo() {
    const mod = await import("./publish");
    return mod.publishFacebookVideo(arguments[0]);
  },
};
