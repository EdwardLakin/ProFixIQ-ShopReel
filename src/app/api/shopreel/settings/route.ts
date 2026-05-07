import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveShopReelSettings } from "@/features/shopreel/settings/saveShopReelSettings";
import { getShopReelSettings } from "@/features/shopreel/settings/getShopReelSettings";
import { upsertBrandBrainProfile } from "@/features/shopreel/brain/repository";
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

export async function GET() {
  try {
    const shopId = await resolveShopId();
    const bundle = await getShopReelSettings(shopId);
    return NextResponse.json(bundle);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
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
      brandBrain?: {
        positioning?: string | null;
        brandVoiceRules?: string | null;
        prohibitedClaims?: string[];
        preferredCtas?: string[];
        visualStyleNotes?: string | null;
        audienceNotes?: string | null;
      };
    };

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

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

    if (body.brandBrain) {
      await upsertBrandBrainProfile({
        shopId,
        userId: authData.user?.id ?? null,
        positioning: body.brandBrain.positioning ?? null,
        brandVoiceRules: body.brandBrain.brandVoiceRules ?? null,
        prohibitedClaims: Array.isArray(body.brandBrain.prohibitedClaims) ? body.brandBrain.prohibitedClaims : [],
        preferredCtas: Array.isArray(body.brandBrain.preferredCtas) ? body.brandBrain.preferredCtas : [],
        visualStyleNotes: body.brandBrain.visualStyleNotes ?? null,
        audienceNotes: body.brandBrain.audienceNotes ?? null,
      });
    }

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
