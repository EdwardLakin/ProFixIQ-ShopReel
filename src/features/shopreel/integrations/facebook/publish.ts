import { createAdminClient } from "@/lib/supabase/server";
import type { PublishInput, PublishResult } from "../shared/types";

type SocialConnectionRow = {
  access_token: string | null;
  meta_page_id: string | null;
  connection_active: boolean | null;
};

type MetaVideoUploadResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

export async function publishFacebookVideo(
  input: PublishInput,
): Promise<PublishResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("shopreel_social_connections")
    .select("access_token, meta_page_id, connection_active")
    .eq("shop_id", input.shopId)
    .eq("platform", "facebook")
    .eq("connection_active", true)
    .limit(1)
    .maybeSingle();

  const connection = data as SocialConnectionRow | null;

  if (error) {
    throw new Error(error.message);
  }

  if (!connection?.access_token || !connection.meta_page_id) {
    throw new Error("Facebook is not connected for this shop.");
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${encodeURIComponent(connection.meta_page_id)}/videos`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        file_url: input.videoUrl,
        description: input.caption ?? input.title,
        title: input.title,
        access_token: connection.access_token,
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
    status: "published",
  };
}
