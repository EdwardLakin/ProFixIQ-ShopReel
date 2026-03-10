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

type ShopReelConnectionStatus =
  | "not_connected"
  | "connected"
  | "expired"
  | "error";

type ShopReelSettingsRow = {
  shop_id: string;
  publish_mode: "manual" | "approval_required" | "autopilot";
  default_cta: string | null;
  default_location: string | null;
  brand_voice: string | null;
  enabled_platforms: string[] | null;
  connected_platforms: string[] | null;
  onboarding_completed: boolean;
};

type ContentPlatformAccountRow = {
  platform:
    | "instagram_reels"
    | "facebook"
    | "youtube_shorts"
    | "tiktok"
    | "blog"
    | "linkedin"
    | "google_business"
    | "email";
  account_label: string | null;
  connection_active: boolean;
  token_expires_at: string | null;
  metadata: unknown;
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

  const settingsResult = await supabase
    .from("shop_reel_settings")
    .select(
      "shop_id, publish_mode, default_cta, default_location, brand_voice, enabled_platforms, connected_platforms, onboarding_completed",
    )
    .eq("shop_id", shopId)
    .maybeSingle();

  if (settingsResult.error) {
    throw new Error(settingsResult.error.message);
  }

  const platformAccountsResult = await supabase
    .from("content_platform_accounts")
    .select("platform, account_label, connection_active, token_expires_at, metadata")
    .eq("shop_id", shopId)
    .order("platform", { ascending: true });

  if (platformAccountsResult.error) {
    throw new Error(platformAccountsResult.error.message);
  }

  const settings = settingsResult.data as ShopReelSettingsRow | null;
  const platformAccounts =
    (platformAccountsResult.data as ContentPlatformAccountRow[] | null) ?? [];

  const normalizedPlatforms: ShopReelSettingsBundle["platforms"] =
  DEFAULT_PLATFORMS.map((platform) => {
    const row =
      platformAccounts.find((account) => account.platform === platform) ?? null;

    const expired =
      row?.token_expires_at != null &&
      new Date(row.token_expires_at).getTime() <= Date.now();

        const connectionStatus: ShopReelConnectionStatus = row
      ? expired
        ? "expired"
        : row.connection_active
          ? "connected"
          : "not_connected"
      : "not_connected";

    return {
      platform,
      enabled: settings?.enabled_platforms?.includes(platform) ?? false,
      connection_active: row?.connection_active ?? false,
      connection_status: connectionStatus,
      publish_mode: "manual",
      account_label: row?.account_label ?? null,
      metadata:
        row?.metadata &&
        typeof row.metadata === "object" &&
        !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : {},
    };
  });

  const enabledCount = normalizedPlatforms.filter((p) => p.enabled).length;
  const connectedCount = normalizedPlatforms.filter(
    (p) => p.connection_active && p.connection_status === "connected",
  ).length;

  const missing: string[] = [];

  if (!settings?.default_cta) {
    missing.push("Default CTA");
  }

  if (!settings?.default_location) {
    missing.push("Default location");
  }

  if (!settings?.brand_voice) {
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
          connected_platforms: normalizedPlatforms
            .filter((p) => p.connection_active)
            .map((p) => p.platform),
          onboarding_completed: settings.onboarding_completed,
        }
      : null,
    brandProfile: null,
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