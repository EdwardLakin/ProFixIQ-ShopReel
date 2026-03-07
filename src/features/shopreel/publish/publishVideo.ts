import { createAdminClient } from "@/lib/supabase/server";
import { publishToTikTok } from "@/features/shopreel/platforms/tiktok";
import { publishToInstagram } from "@/features/shopreel/platforms/instagram";
import { publishToFacebook } from "@/features/shopreel/platforms/facebook";
import { publishToYouTube } from "@/features/shopreel/platforms/youtube";

export async function publishVideo(videoId: string, platform: string) {
  const supabase = createAdminClient();

  const normalized = platform.toLowerCase();

  const result =
    normalized === "tiktok"
      ? await publishToTikTok(videoId)
      : normalized === "instagram"
        ? await publishToInstagram(videoId)
        : normalized === "facebook"
          ? await publishToFacebook(videoId)
          : normalized === "youtube"
            ? await publishToYouTube(videoId)
            : { platform: normalized, status: "unsupported", externalId: null, videoId };

  await supabase.from("video_publications").insert(
    {
      video_id: videoId,
      platform: result.platform,
      platform_video_id: result.externalId,
      status: result.status,
      published_at: result.status === "published" ? new Date().toISOString() : null,
    } as never,
  );

  return result;
}
