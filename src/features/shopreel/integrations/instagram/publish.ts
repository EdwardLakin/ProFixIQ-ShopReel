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

type SocialConnectionRow = {
  access_token: string | null;
  meta_instagram_business_id: string | null;
  account_id: string | null;
  connection_active: boolean | null;
};

export async function publishInstagramVideo(
  input: PublishInput,
): Promise<PublishResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("shopreel_social_connections")
    .select("access_token, meta_instagram_business_id, account_id, connection_active")
    .eq("shop_id", input.shopId)
    .eq("platform", "instagram_reels")
    .eq("connection_active", true)
    .limit(1)
    .maybeSingle();

  const connection = data as SocialConnectionRow | null;

  if (error) {
    throw new Error(error.message);
  }

  if (!connection?.access_token) {
    throw new Error("Instagram is not connected for this shop.");
  }

  const instagramBusinessId =
    connection.meta_instagram_business_id ?? connection.account_id;

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
        access_token: connection.access_token,
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
        access_token: connection.access_token,
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
    platform: "instagram_reels",
    remotePostId: publishJson.id,
    status: "published",
  };
}
