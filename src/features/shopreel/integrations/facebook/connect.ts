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
  platform_account_id: string | null;
  metadata: unknown;
};

function buildFacebookScopes(): string {
  return [
    "pages_show_list",
    "pages_manage_metadata",
    "pages_read_engagement",
    "business_management",
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

function readMetaPageId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>).meta_page_id;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function selectPreferredFacebookPage(
  pages: Array<{
    id: string;
    name?: string;
    access_token?: string;
    instagram_business_account?: {
      id?: string;
    } | null;
  }>,
) {
  if (pages.length === 0) return null;

  const preferredByName =
    pages.find((page) => {
      const name = (page.name ?? "").trim().toLowerCase();
      return name === "shopreel ai" || name === "shopreel.profixiq";
    }) ?? null;

  if (preferredByName) return preferredByName;

  const pageWithInstagram =
    pages.find((page) => page.instagram_business_account?.id) ?? null;

  if (pageWithInstagram) return pageWithInstagram;

  return pages[0] ?? null;
}

async function saveFacebookPlatformAccount(args: {
  shopId: string;
  accessToken: string;
  tokenExpiresAt: string | null;
  pageId: string | null;
  pageName: string | null;
  pageAccessToken: string | null;
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

  const { data: existingRows, error: existingError } = await supabase
    .from("content_platform_accounts")
    .select("id, platform_account_id, metadata")
    .eq("tenant_shop_id", args.shopId)
    .eq("platform", "facebook")
    .order("updated_at", { ascending: false });

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existing =
    ((existingRows ?? []) as ContentPlatformAccountRow[]).find((row) => {
      return (
        row.platform_account_id === platformAccountId ||
        row.platform_account_id === args.userId ||
        readMetaPageId(row.metadata) === args.pageId
      );
    }) ?? null;

  const writePayload = {
    platform_username: args.pageName ?? args.userName ?? null,
    connection_active: true,
    access_token_encrypted: args.pageAccessToken ?? args.accessToken,
    refresh_token_encrypted: null,
    token_expires_at: args.tokenExpiresAt,
    scopes,
    metadata,
    last_connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    platform_account_id: platformAccountId,
  };

  if (existing?.id) {
    const { data: updatedData, error: updateError } = await supabase
      .from("content_platform_accounts")
      .update(writePayload)
      .eq("id", existing.id)
      .select("id")
      .single();

    if (updateError || !updatedData?.id) {
      throw new Error(updateError?.message ?? "Failed to update Facebook account");
    }

    return updatedData.id;
  }

  const { data: insertedData, error: insertError } = await supabase
    .from("content_platform_accounts")
    .insert({
      tenant_shop_id: args.shopId,
      source_shop_id: args.shopId,
      source_system: "profixiq",
      platform: "facebook",
      platform_account_id: platformAccountId,
      platform_username: args.pageName ?? args.userName ?? null,
      connection_active: true,
      access_token_encrypted: args.pageAccessToken ?? args.accessToken,
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

  if (insertError || !insertedData?.id) {
    throw new Error(insertError?.message ?? "Failed to create Facebook account");
  }

  return insertedData.id;
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

    const pagesText = await pagesRes.text();
    console.log("FACEBOOK /me/accounts status:", pagesRes.status);
    console.log("FACEBOOK /me/accounts raw:", pagesText);

    let pagesJson: MetaPagesResponse = {};
    try {
      pagesJson = JSON.parse(pagesText) as MetaPagesResponse;
    } catch {
      throw new Error(`Invalid /me/accounts response: ${pagesText}`);
    }

    const pages = Array.isArray(pagesJson.data) ? pagesJson.data : [];
    const selectedPage = selectPreferredFacebookPage(pages);

    if (!pagesRes.ok) {
      throw new Error(
        pagesJson.error?.message ??
          `Failed to load Facebook Pages. Raw response: ${pagesText}`,
      );
    }

    if (pages.length === 0) {
      throw new Error(`No Facebook Pages were returned. Raw response: ${pagesText}`);
    }

    if (!selectedPage) {
      throw new Error("No usable Facebook Page was found for this account.");
    }

    const savedAccountId = await saveFacebookPlatformAccount({
      shopId,
      accessToken,
      tokenExpiresAt,
      pageId: selectedPage.id ?? null,
      pageName: selectedPage.name ?? null,
      pageAccessToken: selectedPage.access_token ?? null,
      userId: meJson.id ?? null,
      userName: meJson.name ?? null,
      instagramBusinessId: selectedPage.instagram_business_account?.id ?? null,
    });

    return {
      ok: true,
      platform: "facebook",
      shopId,
      accountLabel: selectedPage.name ?? meJson.name ?? "Facebook Account",
      platformAccountId: savedAccountId,
    };
  },

  async publishVideo(input) {
    const mod = await import("./publish");
    return mod.publishFacebookVideo(input);
  },
};