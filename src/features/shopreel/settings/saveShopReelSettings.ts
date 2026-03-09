import { createAdminClient } from "@/lib/supabase/server";
import type { ShopReelPlatform } from "./getShopReelSettings";

type SavePayload = {
  shopId: string;
  publishMode: "manual" | "approval_required" | "autopilot";
  defaultCta: string;
  defaultLocation: string;
  brandVoice: string;
  onboardingCompleted: boolean;
  platforms: Array<{
    platform: ShopReelPlatform;
    enabled: boolean;
    connectionActive: boolean;
    publishMode: "manual" | "scheduled" | "autopilot";
  }>;
};

export async function saveShopReelSettings(payload: SavePayload) {
  const supabase = createAdminClient();

  const enabledPlatforms = payload.platforms
    .filter((p) => p.enabled)
    .map((p) => p.platform);

  const connectedPlatforms = payload.platforms
    .filter((p) => p.connectionActive)
    .map((p) => p.platform);

  const { error: settingsError } = await supabase
    .from("shop_reel_settings")
    .upsert(
      {
        shop_id: payload.shopId,
        publish_mode: payload.publishMode,
        default_cta: payload.defaultCta,
        default_location: payload.defaultLocation,
        brand_voice: payload.brandVoice,
        enabled_platforms: enabledPlatforms,
        connected_platforms: connectedPlatforms,
        onboarding_completed: payload.onboardingCompleted,
      },
      { onConflict: "shop_id" },
    );

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const { error: brandError } = await supabase
    .from("shop_reel_brand_profiles")
    .upsert(
      {
        shop_id: payload.shopId,
        default_cta: payload.defaultCta,
        default_location: payload.defaultLocation,
        brand_voice: payload.brandVoice,
        color_mode: "profixiq_copper",
      },
      { onConflict: "shop_id" },
    );

  if (brandError) {
    throw new Error(brandError.message);
  }

  const platformRows = payload.platforms.map((platform) => ({
    shop_id: payload.shopId,
    platform: platform.platform,
    enabled: platform.enabled,
    connection_active: platform.connectionActive,
    connection_status: platform.connectionActive ? "connected" : "not_connected",
    publish_mode: platform.publishMode,
  }));

  const { error: platformError } = await supabase
    .from("shop_reel_platform_settings")
    .upsert(platformRows, { onConflict: "shop_id,platform" });

  if (platformError) {
    throw new Error(platformError.message);
  }

  return {
    ok: true,
    shopId: payload.shopId,
    enabledPlatforms,
    connectedPlatforms,
  };
}
