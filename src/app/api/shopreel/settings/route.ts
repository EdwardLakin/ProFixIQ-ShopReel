import { NextRequest, NextResponse } from "next/server";
import { getShopReelSettings } from "@/features/shopreel/settings/getShopReelSettings";
import { saveShopReelSettings } from "@/features/shopreel/settings/saveShopReelSettings";

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId") || DEFAULT_SHOP_ID;

  const result = await getShopReelSettings(shopId);
  return NextResponse.json({ ok: true, result });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | {
        shopId?: string;
        publishMode?: "manual" | "approval_required" | "autopilot";
        defaultCta?: string;
        defaultLocation?: string;
        brandVoice?: string;
        onboardingCompleted?: boolean;
        platforms?: Array<{
          platform:
            | "instagram"
            | "facebook"
            | "youtube"
            | "tiktok";
          enabled?: boolean;
          connectionActive?: boolean;
          publishMode?: "manual" | "scheduled" | "autopilot";
        }>;
      }
    | null;

  const result = await saveShopReelSettings({
    shopId: body?.shopId || DEFAULT_SHOP_ID,
    publishMode: body?.publishMode || "manual",
    defaultCta: body?.defaultCta || "",
    defaultLocation: body?.defaultLocation || "",
    brandVoice: body?.brandVoice || "",
    onboardingCompleted: Boolean(body?.onboardingCompleted),
    platforms: Array.isArray(body?.platforms)
      ? body!.platforms.map((p) => ({
          platform: p.platform,
          enabled: Boolean(p.enabled),
          connectionActive: Boolean(p.connectionActive),
          publishMode: p.publishMode || "manual",
        }))
      : [],
  });

  return NextResponse.json(result);
}
