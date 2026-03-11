import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveShopReelSettings } from "@/features/shopreel/settings/saveShopReelSettings";
import type { ShopReelPlatform } from "@/features/shopreel/settings/getShopReelSettings";

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

async function resolveShopId() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return DEFAULT_SHOP_ID;
  }

  const { data: shopIdData, error: shopIdError } = await supabase.rpc(
    "current_tenant_shop_id",
  );

  if (shopIdError || !shopIdData) {
    return DEFAULT_SHOP_ID;
  }

  return String(shopIdData);
}

export async function POST(req: NextRequest) {
  try {
    const shopId = await resolveShopId();

    const body = (await req.json().catch(() => ({}))) as {
      publishMode?: "manual" | "approval_required" | "autopilot";
      defaultCta?: string | null;
      defaultLocation?: string | null;
      brandVoice?: string | null;
      enabledPlatforms?: ShopReelPlatform[];
      platforms?: ShopReelPlatform[];
      onboardingCompleted?: boolean;
    };

    const result = await saveShopReelSettings({
      shopId,
      publishMode: body.publishMode ?? "manual",
      defaultCta: body.defaultCta ?? null,
      defaultLocation: body.defaultLocation ?? null,
      brandVoice: body.brandVoice ?? null,
      enabledPlatforms: Array.isArray(body.enabledPlatforms)
        ? body.enabledPlatforms
        : Array.isArray(body.platforms)
          ? body.platforms
          : [],
      onboardingCompleted: body.onboardingCompleted ?? false,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
