import { createAdminClient } from "@/lib/supabase/server";

export type ShopReelPlatform =
  | "instagram_reels"
  | "facebook"
  | "youtube_shorts"
  | "tiktok";

export type ShopReelSettingsBundle = {
  settings: {
    shop_id: string;
    publish_mode: "manual" | "approval_required" | "autopilot";
    default_cta: string | null;
    default_location: string | null;
    brand_voice: string | null;
    enabled_platforms: string[];
    connected_platforms: string[];
    onboarding_completed: boolean;
  } | null;
  brandProfile: {
    brand_name: string | null;
    brand_voice: string | null;
    default_cta: string | null;
    default_location: string | null;
    color_mode: "profixiq_copper" | "dark_cyan" | "neutral_dark";
  } | null;
  platforms: Array<{
    platform: ShopReelPlatform;
    enabled: boolean;
    connection_active: boolean;
    connection_status: "not_connected" | "connected" | "expired" | "error";
    publish_mode: "manual" | "scheduled" | "autopilot";
    account_label: string | null;
    metadata: Record<string, unknown>;
  }>;
  readiness: {
    connectedCount: number;
    enabledCount: number;
    canPublish: boolean;
    canAutopilot: boolean;
    missing: string[];
  };
};

const DEFAULT_PLATFORMS: ShopReelPlatform[] = [
  "instagram_reels",
  "facebook",
  "youtube_shorts",
  "tiktok",
];

export async function getShopReelSettings(
  shopId: string,
): Promise<ShopReelSettingsBundle> {
  const supabase = createAdminClient();

  const [{ data: settings }, { data: brandProfile }, { data: platforms }] =
    await Promise.all([
      supabase
        .from("shop_reel_settings")
        .select(
          "shop_id, publish_mode, default_cta, default_location, brand_voice, enabled_platforms, connected_platforms, onboarding_completed",
        )
        .eq("shop_id", shopId)
        .maybeSingle(),
      supabase
        .from("shop_reel_brand_profiles")
        .select(
          "brand_name, brand_voice, default_cta, default_location, color_mode",
        )
        .eq("shop_id", shopId)
        .maybeSingle(),
      supabase
        .from("shop_reel_platform_settings")
        .select(
          "platform, enabled, connection_active, connection_status, publish_mode, account_label, metadata",
        )
        .eq("shop_id", shopId)
        .order("platform", { ascending: true }),
    ]);

  const normalizedPlatforms = DEFAULT_PLATFORMS.map((platform) => {
    const row = (platforms ?? []).find((p) => p.platform === platform);
    return {
      platform,
      enabled: row?.enabled ?? false,
      connection_active: row?.connection_active ?? false,
      connection_status: row?.connection_status ?? "not_connected",
      publish_mode: row?.publish_mode ?? "manual",
      account_label: row?.account_label ?? null,
      metadata:
        row?.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : {},
    };
  });

  const enabledCount = normalizedPlatforms.filter((p) => p.enabled).length;
  const connectedCount = normalizedPlatforms.filter(
    (p) => p.connection_active && p.connection_status === "connected",
  ).length;

  const missing: string[] = [];

  if (!settings?.default_cta && !brandProfile?.default_cta) {
    missing.push("Default CTA");
  }

  if (!settings?.default_location && !brandProfile?.default_location) {
    missing.push("Default location");
  }

  if (!settings?.brand_voice && !brandProfile?.brand_voice) {
    missing.push("Brand voice");
  }

  if (enabledCount === 0) {
    missing.push("At least one enabled platform");
  }

  if (connectedCount === 0) {
    missing.push("At least one connected platform");
  }

  if (!settings?.onboarding_completed) {
    missing.push("Launch onboarding completion");
  }

  const canPublish = enabledCount > 0 && connectedCount > 0;
  const canAutopilot =
    canPublish &&
    settings?.publish_mode === "autopilot" &&
    (settings?.onboarding_completed ?? false);

  return {
    settings: settings
      ? {
          shop_id: settings.shop_id,
          publish_mode: settings.publish_mode,
          default_cta: settings.default_cta,
          default_location: settings.default_location,
          brand_voice: settings.brand_voice,
          enabled_platforms: settings.enabled_platforms ?? [],
          connected_platforms: settings.connected_platforms ?? [],
          onboarding_completed: settings.onboarding_completed,
        }
      : null,
    brandProfile: brandProfile
      ? {
          brand_name: brandProfile.brand_name,
          brand_voice: brandProfile.brand_voice,
          default_cta: brandProfile.default_cta,
          default_location: brandProfile.default_location,
          color_mode: brandProfile.color_mode,
        }
      : null,
    platforms: normalizedPlatforms,
    readiness: {
      connectedCount,
      enabledCount,
      canPublish,
      canAutopilot,
      missing,
    },
  };
}
