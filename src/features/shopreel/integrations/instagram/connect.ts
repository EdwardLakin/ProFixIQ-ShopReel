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

function buildInstagramScopes(): string {
  return [
    "pages_show_list",
    "pages_read_engagement",
    "pages_read_user_content",
    "pages_manage_metadata",
    "pages_manage_posts",
    "business_management",
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

async function saveInstagramPlatformAccount(args: {
  shopId: string;
  accessToken: string;
  tokenExpiresAt: string | null;
  pageId: string;
  pageName: string | null;
  instagramBusinessId: string;
}): Promise<string> {
  const supabase = createAdminClient();

  const metadata: Json = {
    oauth_platform: "instagram",
    meta_page_id: args.pageId,
    meta_page_name: args.pageName,
    meta_instagram_business_id: args.instagramBusinessId,
  };

  const scopes = buildInstagramScopes().split(",");

  const { data: existingData, error: existingError } = await supabase
    .from("content_platform_accounts")
    .select("id")
    .eq("tenant_shop_id", args.shopId)
    .eq("platform", "instagram")
    .eq("platform_account_id", args.instagramBusinessId)
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
        platform_username: args.pageName ?? null,
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
      throw new Error(updateError?.message ?? "Failed to update Instagram account");
    }

    return updated.id;
  }

  const { data: insertedData, error: insertError } = await supabase
    .from("content_platform_accounts")
    .insert({
      tenant_shop_id: args.shopId,
      source_shop_id: args.shopId,
      source_system: "profixiq",
      platform: "instagram",
      platform_account_id: args.instagramBusinessId,
      platform_username: args.pageName ?? null,
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
    throw new Error(insertError?.message ?? "Failed to create Instagram account");
  }

  return inserted.id;
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
    const instagramBusinessId = page.instagram_business_account?.id ?? null;

    if (!instagramBusinessId) {
      throw new Error("Instagram Business account ID is missing.");
    }

    const savedAccountId = await saveInstagramPlatformAccount({
      shopId,
      accessToken,
      tokenExpiresAt,
      pageId: page.id,
      pageName: page.name ?? null,
      instagramBusinessId,
    });

    return {
      ok: true,
      platform: "instagram",
      shopId,
      accountLabel: page.name ?? "Instagram Business Account",
      platformAccountId: savedAccountId,
    };
  },

  async publishVideo(input) {
    const mod = await import("./publish");
    return mod.publishInstagramVideo(input);
  },
};
