import type { GrowthCampaignType, GrowthPlatform } from "./types";

export function buildCampaignTitle(featureTitle: string, campaignType: GrowthCampaignType): string {
  const label = campaignType.replaceAll("_", " ");
  return `${featureTitle} · ${label}`;
}

export function buildCampaignObjective(featureTitle: string): string {
  return `Explain how ${featureTitle} helps teams move from idea to export-ready asset without workflow thrash.`;
}

export function platformsOrDefault(platforms: GrowthPlatform[]): GrowthPlatform[] {
  return platforms.length ? platforms : ["instagram", "linkedin", "x", "blog"];
}
