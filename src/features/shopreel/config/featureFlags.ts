export const SHOPREEL_MVP_FLAGS = {
  manualExportFirst: true,
  showAdvancedRoutes: true,
  showSocialPublishing: false,
  showCalendarPublishing: false,
  showAnalyticsSync: false,
  showExperimentalVideoStudio: true,
} as const;

export type ShopReelMvpFlag = keyof typeof SHOPREEL_MVP_FLAGS;

export function isShopReelMvpFlagEnabled(flag: ShopReelMvpFlag): boolean {
  return SHOPREEL_MVP_FLAGS[flag];
}
