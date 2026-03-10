import { NextRequest, NextResponse } from "next/server";

const META_CLIENT_ID = process.env.META_CLIENT_ID!;
const BASE_URL = process.env.APP_URL!;

type SupportedConnectPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube";

function buildMetaRedirectUrl(platform: "instagram" | "facebook") {
  const redirectUri = `${BASE_URL}/api/shopreel/oauth/callback?platform=${platform}`;

  const scope =
    platform === "instagram"
      ? [
          "pages_show_list",
          "pages_read_engagement",
          "pages_manage_posts",
          "instagram_basic",
          "instagram_content_publish",
        ].join(",")
      : [
          "pages_show_list",
          "pages_read_engagement",
          "pages_manage_posts",
        ].join(",");

  return (
    `https://www.facebook.com/v18.0/dialog/oauth` +
    `?client_id=${encodeURIComponent(META_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&response_type=code`
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") as SupportedConnectPlatform | null;

  if (!platform) {
    return NextResponse.json({ error: "platform required" }, { status: 400 });
  }

  if (
    platform !== "instagram" &&
    platform !== "facebook" &&
    platform !== "tiktok" &&
    platform !== "youtube"
  ) {
    return NextResponse.json({ error: "unsupported platform" }, { status: 400 });
  }

  if (platform === "instagram" || platform === "facebook") {
    const url = buildMetaRedirectUrl(platform);
    return NextResponse.redirect(url);
  }

  if (platform === "tiktok") {
    return NextResponse.redirect(
      `${BASE_URL}/shopreel/settings?oauth_error=${encodeURIComponent(
        "TikTok OAuth is not wired yet",
      )}`,
    );
  }

  return NextResponse.redirect(
    `${BASE_URL}/shopreel/settings?oauth_error=${encodeURIComponent(
      "YouTube OAuth is not wired yet",
    )}`,
  );
}