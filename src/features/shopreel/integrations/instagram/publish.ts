import { createAdminClient } from "@/lib/supabase/server";
import type { PublishInput, PublishResult } from "../shared/types";

type MetaMediaCreateResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

type MetaPublishResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

type PlatformAccountRow = {
  access_token_encrypted: string | null;
  metadata: unknown;
  platform_account_id: string | null;
  connection_active: boolean;
};

type MetaInstagramMetadata = {
  meta_instagram_business_id?: string | null;
};

function readInstagramBusinessId(
  metadata: unknown,
  platformAccountId: string | null,
): string | null {
  if (metadata && typeof metadata === "object") {
    const record = metadata as MetaInstagramMetadata;
    if (
      typeof record.meta_instagram_business_id === "string" &&
      record.meta_instagram_business_id.length > 0
    ) {
      return record.meta_instagram_business_id;
    }
  }

  return platformAccountId;
}

export async function publishInstagramVideo(
  input: PublishInput,
): Promise<PublishResult> {
  const supabase = createAdminClient();

  const accountQuery = supabase
    .from("content_platform_accounts")
    .select("access_token_encrypted, metadata, platform_account_id, connection_active")
    .eq("shop_id", input.shopId)
    .eq("platform", "instagram")
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
    throw new Error("Instagram is not connected for this shop.");
  }

  const instagramBusinessId = readInstagramBusinessId(
    connection.metadata,
    connection.platform_account_id,
  );

  if (!instagramBusinessId) {
    throw new Error("Instagram Business account ID is missing.");
  }

  const createContainerRes = await fetch(
    `https://graph.facebook.com/v18.0/${encodeURIComponent(instagramBusinessId)}/media`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        media_type: "REELS",
        video_url: input.videoUrl,
        caption: input.caption ?? input.title,
        access_token: connection.access_token_encrypted,
      }).toString(),
      cache: "no-store",
    },
  );

  const createContainerJson =
    (await createContainerRes.json().catch(() => ({}))) as MetaMediaCreateResponse;

  if (!createContainerRes.ok || !createContainerJson.id) {
    throw new Error(
      createContainerJson.error?.message ??
        "Failed to create Instagram media container.",
    );
  }

  const publishRes = await fetch(
    `https://graph.facebook.com/v18.0/${encodeURIComponent(instagramBusinessId)}/media_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        creation_id: createContainerJson.id,
        access_token: connection.access_token_encrypted,
      }).toString(),
      cache: "no-store",
    },
  );

  const publishJson =
    (await publishRes.json().catch(() => ({}))) as MetaPublishResponse;

  if (!publishRes.ok || !publishJson.id) {
    throw new Error(
      publishJson.error?.message ?? "Failed to publish Instagram Reel.",
    );
  }

  return {
    ok: true,
    platform: "instagram",
    remotePostId: publishJson.id,
    remotePostUrl: null,
    status: "published",
  };
}