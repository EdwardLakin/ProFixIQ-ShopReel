import { createAdminClient } from "@/lib/supabase/server";
import type { PublishInput, PublishResult } from "../shared/types";

type MetaVideoUploadResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

type PlatformAccountRow = {
  id?: string;
  access_token_encrypted: string | null;
  metadata: unknown;
  platform_account_id: string | null;
  connection_active: boolean;
};

type MetaFacebookMetadata = {
  meta_page_id?: string | null;
};

function readPageId(
  metadata: unknown,
  platformAccountId: string | null,
): string | null {
  if (metadata && typeof metadata === "object") {
    const record = metadata as MetaFacebookMetadata;
    if (typeof record.meta_page_id === "string" && record.meta_page_id.length > 0) {
      return record.meta_page_id;
    }
  }

  return platformAccountId;
}

export async function publishFacebookVideo(
  input: PublishInput,
): Promise<PublishResult> {
  const supabase = createAdminClient();

  const accountQuery = supabase
    .from("content_platform_accounts")
    .select("id, access_token_encrypted, metadata, platform_account_id, connection_active")
    .eq("tenant_shop_id", input.shopId)
    .eq("platform", "facebook")
    .eq("connection_active", true)
    .limit(1);

  const { data, error } = input.platformAccountId
    ? await accountQuery.eq("id", input.platformAccountId).maybeSingle()
    : await accountQuery.maybeSingle();

  const connection = data as PlatformAccountRow | null;

  if (error) {
    throw new Error(error.message);
  }

  if (!connection?.access_token_encrypted) {
    throw new Error("Facebook is not connected for this shop.");
  }

  const pageId = readPageId(connection.metadata, connection.platform_account_id);

  if (!pageId) {
    throw new Error("Facebook Page ID is missing.");
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${encodeURIComponent(pageId)}/videos`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        file_url: input.videoUrl,
        description: input.caption ?? input.title,
        title: input.title,
        access_token: connection.access_token_encrypted,
      }).toString(),
      cache: "no-store",
    },
  );

  const json =
    (await response.json().catch(() => ({}))) as MetaVideoUploadResponse;

  if (!response.ok || !json.id) {
    throw new Error(json.error?.message ?? "Failed to publish Facebook video.");
  }

  return {
    ok: true,
    platform: "facebook",
    remotePostId: json.id,
    remotePostUrl: null,
    status: "published",
  };
}