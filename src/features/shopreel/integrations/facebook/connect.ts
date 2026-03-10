import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";
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

type ContentPlatformAccountRow = {
  id: string;
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

  console.log("FACEBOOK_TOKEN_EXCHANGE_REDIRECT_URI", redirectUri);

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

async function saveFacebookPlatformAccount(args: {
  shopId: string;
  accessToken: string;
  tokenExpiresAt: string | null;
  pageId: string | null;
  pageName: string | null;
  userId: string | null;
  userName: string | null;
  instagramBusinessId: string | null;
}): Promise<string> {
  const supabase = createAdminClient();

  const platformAccountId = args.pageId ?? args.userId;

  if (!platformAccountId) {
    throw new Error("Facebook platform account ID is missing.");
  }

  const metadata: Json = {
    oauth_platform: "facebook",
    meta_user_id: args.userId,
    meta_user_name: args.userName,
    meta_page_id: args.pageId,
    meta_page_name: args.pageName,
    meta_instagram_business_id: args.instagramBusinessId,
  };

  const scopes = buildFacebookScopes().split(",");

  const { data: existingData, error: existingError } = await supabase
    .from("content_platform_accounts")
    .select("id")
    .eq("shop_id", args.shopId)
    .eq("platform", "facebook")
    .eq("platform_account_id", platformAccountId)
    .limit(1)
    .maybeSingle();

  const existing = existingData as ContentPlatformAccountRow | null;

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    const { data: updatedData, error: updateError } = await supabase
      .from("content_platform_accounts")
      .update({
        account_label: args.pageName ?? args.userName ?? "Facebook Account",
        platform_username: args.userName ?? args.pageName ?? null,
        connection_active: true,
        access_token_encrypted: args.accessToken,
        refresh_token_encrypted: null,
        token_expires_at: args.tokenExpiresAt,
        scopes,
        metadata,
        last_connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id")
      .single();

    const updated = updatedData as ContentPlatformAccountRow | null;

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? "Failed to update Facebook account");
    }

    return updated.id;
  }

  const { data: insertedData, error: insertError } = await supabase
    .from("content_platform_accounts")
    .insert({
      shop_id: args.shopId,
      platform: "facebook",
      account_label: args.pageName ?? args.userName ?? "Facebook Account",
      platform_account_id: platformAccountId,
      platform_username: args.userName ?? args.pageName ?? null,
      connection_active: true,
      access_token_encrypted: args.accessToken,
      refresh_token_encrypted: null,
      token_expires_at: args.tokenExpiresAt,
      scopes,
      metadata,
      last_connected_at: new Date().toISOString(),
      last_sync_at: null,
      created_by: null,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const inserted = insertedData as ContentPlatformAccountRow | null;

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Failed to create Facebook account");
  }

  return inserted.id;
}

export const facebookIntegration: PlatformIntegration = {
  async startOAuth(_: string): Promise<OAuthStartResult> {
    const redirectUri = buildOAuthCallbackUrl("facebook");

    const authorizationUrl =
      `https://www.facebook.com/v18.0/dialog/oauth` +
      `?client_id=${encodeURIComponent(getMetaClientId())}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(buildFacebookScopes())}` +
      `&response_type=code`;

    console.log("FACEBOOK_OAUTH_REDIRECT_URI", redirectUri);
    console.log("FACEBOOK_OAUTH_URL", authorizationUrl);

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
    const firstPage = Array.isArray(pagesJson.data) ? pagesJson.data[0] ?? null : null;

    const savedAccountId = await saveFacebookPlatformAccount({
      shopId,
      accessToken,
      tokenExpiresAt,
      pageId: firstPage?.id ?? null,
      pageName: firstPage?.name ?? null,
      userId: meJson.id ?? null,
      userName: meJson.name ?? null,
      instagramBusinessId: firstPage?.instagram_business_account?.id ?? null,
    });

    return {
      ok: true,
      platform: "facebook",
      shopId,
      accountLabel: firstPage?.name ?? meJson.name ?? "Facebook Account",
      platformAccountId: savedAccountId,
    };
  },

  async publishVideo(input) {
    const mod = await import("./publish");
    return mod.publishFacebookVideo(input);
  },
};