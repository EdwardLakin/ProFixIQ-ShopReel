import { NextRequest, NextResponse } from "next/server";
import { instagramIntegration } from "@/features/shopreel/integrations/instagram/connect";
import { facebookIntegration } from "@/features/shopreel/integrations/facebook/connect";

type SupportedConnectPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube";

const BASE_URL = process.env.APP_URL!;

export async function GET(req: NextRequest) {
  try {
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

    if (platform === "instagram") {
      const result = await instagramIntegration.startOAuth("");
      return NextResponse.redirect(result.authorizationUrl);
    }

    if (platform === "facebook") {
      const result = await facebookIntegration.startOAuth("");
      return NextResponse.redirect(result.authorizationUrl);
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
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected OAuth error",
      },
      { status: 500 },
    );
  }
}