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

  const inactivePlatforms = payload.platforms
    .filter((platform) => !platform.connectionActive)
    .map((platform) => platform.platform);

  if (inactivePlatforms.length > 0) {
    const { error: deactivateError } = await supabase
      .from("content_platform_accounts")
      .update({
        connection_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_shop_id", payload.shopId)
      .in("platform", inactivePlatforms);

    if (deactivateError) {
      throw new Error(deactivateError.message);
    }
  }

  const activePlatforms = payload.platforms.filter(
    (platform) => platform.connectionActive,
  );

  if (activePlatforms.length > 0) {
    const activeRows = activePlatforms.map((platform) => ({
      tenant_shop_id: payload.shopId,
      source_shop_id: payload.shopId,
      source_system: "profixiq",
      platform: platform.platform,
      connection_active: true,
      updated_at: new Date().toISOString(),
    }));

    const { error: activateError } = await supabase
      .from("content_platform_accounts")
      .upsert(activeRows, {
        onConflict: "tenant_shop_id,platform,platform_account_id",
      });

    if (activateError) {
      throw new Error(activateError.message);
    }
  }

  return {
    ok: true,
    shopId: payload.shopId,
    enabledPlatforms,
    connectedPlatforms,
  };
}