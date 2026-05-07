import type { GrowthCampaignType, GrowthPlatform, GrowthRenderCompositionType, GrowthScreenshotViewport } from "./types";

export function generateScreenshotRequests(campaignType: GrowthCampaignType, platform: GrowthPlatform) {
  const common = [
    { title: "Dashboard KPI hero", routeHint: "/shopreel", viewport: "desktop" as GrowthScreenshotViewport, priority: 100 },
    { title: "Render queue UI", routeHint: "/shopreel/settings/developer/growth-agent", viewport: "desktop" as GrowthScreenshotViewport, priority: 90 },
    { title: "Campaign package preview", routeHint: "/shopreel/settings/developer/growth-agent", viewport: "tablet" as GrowthScreenshotViewport, priority: 85 },
    { title: "Storyboard editor", routeHint: "/shopreel/studio", viewport: "desktop" as GrowthScreenshotViewport, priority: 80 },
    { title: "Mobile editor flow", routeHint: "/shopreel/studio", viewport: "mobile" as GrowthScreenshotViewport, priority: 70 },
  ];
  const campaignModifiers: Record<GrowthCampaignType, string> = {
    feature_launch: "Highlight new product workflow",
    build_in_public: "Show transparent build progress",
    comparison: "Capture before and after views",
    tutorial: "Focus on guided steps",
    demo_reel: "Capture motion-friendly surfaces",
    founder_note: "Support personal narrative visuals",
  };
  return common.map((item) => ({ ...item, annotation: `${campaignModifiers[campaignType]} for ${platform}`, status: "requested" as const }));
}

export function generateStarterComposition(assetType: GrowthRenderCompositionType, title: string) {
  const sceneTemplates: Record<GrowthRenderCompositionType, string[]> = {
    short_video: ["Hook scene", "Problem scene", "Product walkthrough scene", "CTA scene"],
    carousel: ["Cover", "Pain point", "Workflow", "Feature", "CTA"],
    promo_clip: ["Hook", "Core feature", "Use case", "CTA"],
    launch_graphic: ["Headline", "Visual proof", "CTA"],
  };
  const scenes = sceneTemplates[assetType].map((name, idx) => ({ order: idx + 1, name, durationSeconds: assetType === "carousel" ? 3 : 4, overlayText: `${title} · ${name}` }));
  const durationSeconds = scenes.reduce((acc, scene) => acc + scene.durationSeconds, 0);
  return {
    compositionType: assetType,
    timeline: scenes.map((scene) => ({ scene: scene.name, durationSeconds: scene.durationSeconds })),
    scenes,
    overlays: scenes.map((scene) => ({ scene: scene.name, text: scene.overlayText })),
    captions: scenes.map((scene) => ({ scene: scene.name, caption: `${scene.name} for ${title}` })),
    transitions: scenes.slice(0, -1).map((scene, idx) => ({ from: scene.name, to: scenes[idx + 1].name, style: "fade" })),
    soundtrackDirection: "Minimal modern pulse, low distraction",
    voiceoverDirection: "Direct, confident, and action-oriented",
    durationSeconds,
    aspectRatio: "9:16",
    renderStatus: "draft",
  };
}

export type RenderReadiness = { score: number; blockers: string[]; warnings: string[]; ready: boolean };
export function calculateRenderReadiness(input: { screenshotRequests: Array<Record<string, unknown>>; assetSources: Array<Record<string, unknown>>; composition: Record<string, unknown> | null; brandKit: Record<string, unknown> | null; storyboard?: unknown; }) : RenderReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const captured = input.screenshotRequests.filter((r) => r.status === "captured" || r.status === "approved");
  if (input.screenshotRequests.length > 0 && captured.length === 0) blockers.push("missing screenshots");
  const uploadedAssets = input.assetSources.filter((a) => a.status === "uploaded" || a.status === "generated");
  if (uploadedAssets.length === 0) blockers.push("missing uploaded assets");
  const captions = (input.composition?.captions as unknown[]) ?? [];
  if (!captions.length) blockers.push("missing captions");
  if (!input.brandKit) blockers.push("missing brand kit");
  const aspect = String(input.composition?.aspect_ratio ?? input.composition?.aspectRatio ?? "");
  if (aspect && !["9:16", "1:1", "16:9", "4:5"].includes(aspect)) blockers.push("unsupported aspect ratio");
  if (!input.storyboard || (typeof input.storyboard === "object" && Array.isArray((input.storyboard as { beats?: unknown[] }).beats) && !(input.storyboard as { beats?: unknown[] }).beats?.length)) blockers.push("incomplete storyboard");
  if (!input.composition) warnings.push("composition not generated yet");
  const score = Math.max(0, 100 - blockers.length * 20 - warnings.length * 10);
  return { score, blockers, warnings, ready: blockers.length === 0 };
}
