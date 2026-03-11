import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import type { ShopReelPlatform } from "./getShopReelSettings";

type DB = Database;

type SupportedAccountPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube";

const SUPPORTED_ACCOUNT_PLATFORMS: readonly SupportedAccountPlatform[] = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
] as const;

function isSupportedAccountPlatform(
  platform: ShopReelPlatform,
): platform is SupportedAccountPlatform {
  return (SUPPORTED_ACCOUNT_PLATFORMS as readonly string[]).includes(platform);
}

export type SaveShopReelSettingsInput = {
  shopId: string;
  publishMode?: "manual" | "approval_required" | "autopilot";
  defaultCta?: string | null;
  defaultLocation?: string | null;
  brandVoice?: string | null;
  enabledPlatforms?: ShopReelPlatform[];
  onboardingCompleted?: boolean;
};

export async function saveShopReelSettings(
  payload: SaveShopReelSettingsInput,
) {
  const supabase = createAdminClient();

  const enabledPlatforms = Array.isArray(payload.enabledPlatforms)
    ? payload.enabledPlatforms
    : [];

  const supportedEnabledPlatforms = enabledPlatforms.filter(
    isSupportedAccountPlatform,
  );

  const settingsUpsert: DB["public"]["Tables"]["shop_reel_settings"]["Insert"] = {
    shop_id: payload.shopId,
    publish_mode: payload.publishMode ?? "manual",
    default_cta: payload.defaultCta ?? null,
    default_location: payload.defaultLocation ?? null,
    brand_voice: payload.brandVoice ?? null,
    enabled_platforms: enabledPlatforms,
    connected_platforms: [],
    onboarding_completed: payload.onboardingCompleted ?? false,
  };

  const { error: settingsError } = await supabase
    .from("shop_reel_settings")
    .upsert(settingsUpsert, { onConflict: "shop_id" });

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (SUPPORTED_ACCOUNT_PLATFORMS.length > 0) {
    const inactivePlatforms = SUPPORTED_ACCOUNT_PLATFORMS.filter(
      (platform) => !supportedEnabledPlatforms.includes(platform),
    );

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

    const activeRows: DB["public"]["Tables"]["content_platform_accounts"]["Insert"][] =
      supportedEnabledPlatforms.map((platform) => ({
        tenant_shop_id: payload.shopId,
        source_shop_id: payload.shopId,
        source_system: "profixiq",
        platform,
        connection_active: true,
        updated_at: new Date().toISOString(),
      }));

    if (activeRows.length > 0) {
      const { error: activeUpsertError } = await supabase
        .from("content_platform_accounts")
        .upsert(activeRows, {
          onConflict: "tenant_shop_id,platform,platform_account_id",
          ignoreDuplicates: false,
        });

      if (activeUpsertError) {
        throw new Error(activeUpsertError.message);
      }
    }
  }

  return {
    ok: true,
    shopId: payload.shopId,
    enabledPlatforms,
    supportedEnabledPlatforms,
  };
}
