import { createAdminClient } from "@/lib/supabase/server";

export type ShopReelPlatform =
  | "instagram"
  | "facebook"
  | "youtube"
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
    | "instagram"
    | "facebook"
    | "youtube"
    | "tiktok"
    | "blog"
    | "linkedin"
    | "google_business"
    | "email";
  platform_account_id: string | null;
  platform_username: string | null;
  connection_active: boolean;
  token_expires_at: string | null;
  metadata: unknown;
};

const DEFAULT_PLATFORMS: ShopReelPlatform[] = [
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
];

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getAccountLabel(row: ContentPlatformAccountRow | null): string | null {
  if (!row) return null;

  const metadata = normalizeMetadata(row.metadata);

  return (
    row.platform_username ??
    (typeof metadata.meta_page_name === "string" ? metadata.meta_page_name : null) ??
    row.platform_account_id ??
    null
  );
}

function pickBestPlatformRow(
  platform: ShopReelPlatform,
  rows: ContentPlatformAccountRow[],
): ContentPlatformAccountRow | null {
  const matching = rows.filter((row) => row.platform === platform);

  if (matching.length === 0) {
    return null;
  }

  const activeNonExpired = matching.find((row) => {
    if (!row.connection_active) {
      return false;
    }

    if (!row.token_expires_at) {
      return true;
    }

    return new Date(row.token_expires_at).getTime() > Date.now();
  });

  if (activeNonExpired) {
    return activeNonExpired;
  }

  const active = matching.find((row) => row.connection_active);
  if (active) {
    return active;
  }

  return matching[0] ?? null;
}

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
    .select(
      "platform, platform_account_id, platform_username, connection_active, token_expires_at, metadata",
    )
    .eq("tenant_shop_id", shopId)
    .order("platform", { ascending: true });

  if (platformAccountsResult.error) {
    throw new Error(platformAccountsResult.error.message);
  }

  const settings = settingsResult.data as ShopReelSettingsRow | null;
  const platformAccounts =
    (platformAccountsResult.data as ContentPlatformAccountRow[] | null) ?? [];

  const normalizedPlatforms: ShopReelSettingsBundle["platforms"] =
    DEFAULT_PLATFORMS.map((platform) => {
      const row = pickBestPlatformRow(platform, platformAccounts);

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
        account_label: getAccountLabel(row),
        metadata: normalizeMetadata(row?.metadata),
      };
    });

  const enabledCount = normalizedPlatforms.filter((p) => p.enabled).length;
  const connectedCount = normalizedPlatforms.filter(
    (p) => p.connection_active && p.connection_status === "connected",
  ).length;

  const missing: string[] = [];

  if (!settings?.default_cta) missing.push("Default CTA");
  if (!settings?.default_location) missing.push("Default location");
  if (!settings?.brand_voice) missing.push("Brand voice");
  if (enabledCount === 0) missing.push("At least one enabled platform");
  if (connectedCount === 0) missing.push("At least one connected platform");
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
