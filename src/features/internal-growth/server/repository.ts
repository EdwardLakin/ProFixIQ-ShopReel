import { createAdminClient } from "@/lib/supabase/server";
import type { DiscoveredGrowthFeature, GrowthAssetPlanStatus, GrowthAssetType, GrowthCampaignType, GrowthDraftStatus, GrowthEngineSourceType, GrowthFeatureStatus, GrowthPlatform, GrowthRunStatus, GrowthSignalStatus, GrowthSignalType } from "./types";
import { buildCampaignObjective, buildCampaignTitle, platformsOrDefault } from "./campaignPlanner";
import { buildDraftSeeds } from "./draftGenerator";
import { ShopReelEndpointError } from "@/features/shopreel/server/endpointPolicy";
import { calculateRenderReadiness, generateScreenshotRequests, generateStarterComposition } from "./assetIntelligence";

function db() { return createAdminClient() as unknown as { from: (table: string) => any }; }

async function logAudit(actor: string, action: string, entityType: string, entityId: string, beforeState: unknown, afterState: unknown) {
  await db().from("internal_growth_audit_logs").insert({ actor, action, entity_type: entityType, entity_id: entityId, before_state: beforeState, after_state: afterState });
}

export async function ensureInternalGrowthSource(actorUserId: string) {
  const { data: existing } = await db().from("growth_engine_sources").select("*").eq("scope_type", "internal_owner").eq("scope_id", actorUserId).eq("source_type", "internal_shopreel_codebase").limit(1);
  if (existing?.length) return existing[0];
  const { data, error } = await db().from("growth_engine_sources").insert({ scope_type: "internal_owner", scope_id: actorUserId, source_type: "internal_shopreel_codebase" as GrowthEngineSourceType, display_name: "ShopReel Codebase", status: "active", config: { scanRoot: "src/app/shopreel" }, metadata: { phase: "bridge_v2" } }).select("*").single();
  if (error) throw error;
  return data;
}

export async function createRun(createdBy: string, status: GrowthRunStatus) { const source = await ensureInternalGrowthSource(createdBy); const { data, error } = await db().from("internal_growth_agent_runs").insert({ created_by: createdBy, status, source_type: "code_scan", metadata: { growthSourceId: source.id } }).select("*").single(); if (error) throw error; return data as { id: string }; }
export async function completeRun(runId: string, status: GrowthRunStatus, summary: string, errorMessage?: string) { const payload: { status: GrowthRunStatus; summary: string; error_message?: string } = { status, summary }; if (errorMessage) payload.error_message = errorMessage; await db().from("internal_growth_agent_runs").update(payload).eq("id", runId); }

export async function upsertFeatures(features: DiscoveredGrowthFeature[], runId: string, actorUserId: string) {
  const source = await ensureInternalGrowthSource(actorUserId);
  const normalized = new Map(features.map((feature) => [feature.featureKey.toLowerCase(), feature]));
  const rows = Array.from(normalized.values()).map((feature) => ({ run_id: runId, feature_key: feature.featureKey.toLowerCase(), title: feature.title, description: feature.description, route_path: feature.routePath, source_files: feature.sourceFiles, audience: feature.audience, value_props: feature.valueProps, launch_angle: feature.launchAngle, metadata: feature.scanMetadata ?? {} }));
  const { data, error } = await db().from("internal_growth_features").upsert(rows, { onConflict: "feature_key" }).select("*");
  if (error) throw error;

  const signalRows = (data ?? []).map((feature: Record<string, unknown>) => ({
    source_id: source.id,
    feature_id: feature.id,
    signal_key: `feature:${String(feature.feature_key)}`,
    signal_type: "feature_detected" as GrowthSignalType,
    title: String(feature.title),
    description: String(feature.description),
    confidence: 0.82,
    evidence: { routePath: feature.route_path, sourceFiles: feature.source_files, scanMetadata: feature.metadata },
    status: "new" as GrowthSignalStatus,
  }));

  if (signalRows.length) {
    const { error: signalError } = await db().from("growth_engine_signals").upsert(signalRows, { onConflict: "signal_key" });
    if (signalError) throw signalError;
  }

  return (data ?? []) as Array<{ id: string }>;
}

export async function updateFeatureStatus(actor: string, id: string, status: GrowthFeatureStatus) {
  const { data: before } = await db().from("internal_growth_features").select("*").eq("id", id).single();
  const { data, error } = await db().from("internal_growth_features").update({ status }).eq("id", id).select("*").single();
  if (error) throw error;
  await logAudit(actor, `feature.${status}`, "feature", id, before, data);
  return data;
}

function buildAssetPlans(campaign: Record<string, unknown>, drafts: Array<Record<string, unknown>>, platforms: GrowthPlatform[]) {
  return platforms.map((platform) => {
    const approvedDraftExists = drafts.some((d) => d.platform === platform && d.status === "approved");
    const requiredInputs = [
      { key: "approved_draft_exists", label: "approved draft exists", satisfied: approvedDraftExists },
      { key: "screenshot_source_available", label: "screenshot source available", satisfied: false },
      { key: "brand_kit_available", label: "brand kit available", satisfied: false },
      { key: "target_platform_selected", label: "target platform selected", satisfied: true },
      { key: "voiceover_script_generated", label: "voiceover script generated", satisfied: true },
    ];
    const missingInputs = requiredInputs.filter((item) => !item.satisfied).map((item) => item.label);
    return {
      campaign_id: campaign.id,
      title: `${String(campaign.title)} · ${platform} package`,
      asset_type: "short_video" as GrowthAssetType,
      target_platform: platform,
      required_inputs: requiredInputs,
      storyboard: { beats: ["Hook on product pain", "UI walkthrough", "Before/after outcome", "CTA close"] },
      shot_list: ["Dashboard overview screenshot", "Feature detail screenshot", "Outcome metrics overlay", "CTA end card"],
      visual_direction: "Minimal dark UI, high-contrast callouts, kinetic subtitles.",
      voiceover_script: `Today we're shipping ${String(campaign.title)}. Here's how ${platform} teams can execute it quickly in ShopReel.`,
      caption: `${String(campaign.title)} in action on ${platform}. Save this workflow and ship this week.`,
      cta: "Open ShopReel and generate your first campaign package.",
      status: (missingInputs.length ? "planned" : "ready_for_render") as GrowthAssetPlanStatus,
      metadata: { futureRenderHandoff: { renderer: "shopreel-render-worker", handoffVersion: "v0", missingInputs }, missingInputs },
    };
  });
}

async function attachAssetPlans(campaign: Record<string, unknown>, drafts: Array<Record<string, unknown>>, platforms: GrowthPlatform[]) {
  const plans = buildAssetPlans(campaign, drafts, platforms);
  if (!plans.length) return;
  const { data: insertedPlans, error } = await db().from("growth_engine_asset_plans").insert(plans).select("*");
  if (error) throw error;
  for (const plan of insertedPlans ?? []) {
    const requests = generateScreenshotRequests(campaign.campaign_type as GrowthCampaignType, plan.target_platform as GrowthPlatform).map((req) => ({
      asset_plan_id: plan.id,
      title: req.title,
      route_hint: req.routeHint,
      viewport: req.viewport,
      priority: req.priority,
      annotation: req.annotation,
      status: req.status,
    }));
    if (requests.length) await db().from("growth_engine_screenshot_requests").insert(requests);
    const composition = generateStarterComposition(plan.asset_type as any, String(plan.title));
    await db().from("growth_engine_render_compositions").insert({
      asset_plan_id: plan.id,
      composition_type: composition.compositionType,
      timeline: composition.timeline,
      scenes: composition.scenes,
      overlays: composition.overlays,
      captions: composition.captions,
      transitions: composition.transitions,
      soundtrack_direction: composition.soundtrackDirection,
      voiceover_direction: composition.voiceoverDirection,
      duration_seconds: composition.durationSeconds,
      aspect_ratio: composition.aspectRatio,
      render_status: composition.renderStatus,
    });
  }
}

export async function generateCampaign(actor: string, featureId: string, campaignType: GrowthCampaignType, targetPlatforms: GrowthPlatform[], forceRegenerate = false) {
  const { data: feature, error: featureError } = await db().from("internal_growth_features").select("*").eq("id", featureId).single(); if (featureError) throw featureError;
  const platforms = platformsOrDefault(targetPlatforms);
  const { data: existing } = await db().from("internal_growth_campaigns").select("*").eq("feature_id", featureId).eq("campaign_type", campaignType).eq("target_platforms", platforms).limit(1);
  if (!forceRegenerate && existing?.length) throw new ShopReelEndpointError("Campaign already exists for this feature/type/platform set. Use forceRegenerate to create another.", 409);
  const { data: campaign, error: campaignError } = await db().from("internal_growth_campaigns").insert({ feature_id: featureId, title: buildCampaignTitle(feature.title as string, campaignType), campaign_type: campaignType, objective: buildCampaignObjective(feature.title as string), target_platforms: platforms, status: "draft" }).select("*").single(); if (campaignError) throw campaignError;
  const seeds = buildDraftSeeds(feature.title as string, feature.description as string, platforms);
  const { data: drafts, error: draftsError } = await db().from("internal_growth_drafts").insert(seeds.map((seed) => ({ campaign_id: campaign.id, platform: seed.platform, format: seed.format, title: seed.title, body: seed.body, hook: seed.hook, cta: seed.cta, status: "draft" }))).select("*"); if (draftsError) throw draftsError;
  await attachAssetPlans(campaign, drafts ?? [], platforms);
  await logAudit(actor, "campaign.generate", "campaign", campaign.id as string, null, campaign);
  return { campaign, drafts };
}

export async function updateDraft(actor: string, id: string, patch: { title?: string; body?: string; hook?: string | null; cta?: string | null; status?: GrowthDraftStatus }) {
  const { data: before } = await db().from("internal_growth_drafts").select("*").eq("id", id).single();
  const { data, error } = await db().from("internal_growth_drafts").update(patch).eq("id", id).select("*").single(); if (error) throw error;
  const action = patch.status === "approved" ? "draft.approve" : patch.status === "rejected" ? "draft.reject" : "draft.edit";
  await logAudit(actor, action, "draft", id, before, data);
  return data;
}

export async function updateSignalStatus(actor: string, signalId: string, status: GrowthSignalStatus) {
  const { data: before } = await db().from("growth_engine_signals").select("*").eq("id", signalId).single();
  const { data, error } = await db().from("growth_engine_signals").update({ status }).eq("id", signalId).select("*").single();
  if (error) throw error;
  await logAudit(actor, `signal.${status}`, "signal", signalId, before, data);
  return data;
}

export async function generateCampaignFromSignal(actor: string, signalId: string, campaignType: GrowthCampaignType, targetPlatforms: GrowthPlatform[]) {
  const { data: signal, error } = await db().from("growth_engine_signals").select("*").eq("id", signalId).single();
  if (error) throw error;
  if (!signal.feature_id) throw new ShopReelEndpointError("Signal cannot be converted yet because no feature is attached", 400);
  await updateSignalStatus(actor, signalId, "accepted");
  const out = await generateCampaign(actor, String(signal.feature_id), campaignType, targetPlatforms, false);
  await updateSignalStatus(actor, signalId, "converted");
  return out;
}

export async function getCampaignPackage(campaignId: string) {
  const { data: campaign, error } = await db().from("internal_growth_campaigns").select("*").eq("id", campaignId).single();
  if (error) throw error;
  const [feature, drafts, assetPlans, screenshotRequests, compositions, assetSources, brandKit, audit] = await Promise.all([
    db().from("internal_growth_features").select("*").eq("id", campaign.feature_id).maybeSingle(),
    db().from("internal_growth_drafts").select("*").eq("campaign_id", campaignId).order("created_at", { ascending: true }),
    db().from("growth_engine_asset_plans").select("*").eq("campaign_id", campaignId).order("created_at", { ascending: true }),
    db().from("growth_engine_screenshot_requests").select("*").in("asset_plan_id", []),
    db().from("growth_engine_render_compositions").select("*").in("asset_plan_id", []),
    db().from("growth_engine_asset_sources").select("*").eq("campaign_id", campaignId),
    db().from("growth_engine_brand_kits").select("*").eq("scope", "internal").limit(1),
    db().from("internal_growth_audit_logs").select("*").eq("entity_id", campaignId).order("created_at", { ascending: false }).limit(30),
  ]);
  const planIds = (assetPlans.data ?? []).map((plan: Record<string, unknown>) => plan.id as string);
  const [shots, comps] = await Promise.all([
    planIds.length ? db().from("growth_engine_screenshot_requests").select("*").in("asset_plan_id", planIds).order("priority", { ascending: false }) : Promise.resolve({ data: [] }),
    planIds.length ? db().from("growth_engine_render_compositions").select("*").in("asset_plan_id", planIds).order("created_at", { ascending: true }) : Promise.resolve({ data: [] }),
  ]);
  const readiness = (comps.data ?? []).map((composition: Record<string, unknown>) => calculateRenderReadiness({
    screenshotRequests: (shots.data ?? []).filter((s: Record<string, unknown>) => s.asset_plan_id === composition.asset_plan_id),
    assetSources: assetSources.data ?? [],
    composition,
    brandKit: (brandKit.data ?? [])[0] ?? null,
    storyboard: (assetPlans.data ?? []).find((plan: Record<string, unknown>) => plan.id === composition.asset_plan_id)?.storyboard,
  }));
  const readyForRender = readiness.every((r: { ready: boolean }) => r.ready);
  return { campaign, feature: feature.data ?? null, drafts: drafts.data ?? [], assetPlans: assetPlans.data ?? [], screenshotRequests: shots.data ?? [], renderCompositions: comps.data ?? [], assetSources: assetSources.data ?? [], renderReadiness: readiness, readyForRender, brandKit: (brandKit.data ?? [])[0] ?? null, futurePublishPayload: { status: "placeholder_internal_only" }, futurePublishStatus: "disabled_internal_only", auditHistory: audit.data ?? [] };
}


export async function createRenderJob(compositionId: string, provider?: string) {
  const payload = { composition_id: compositionId, provider: provider ?? null, status: "queued", progress: 0, metadata: { mode: "simulated_preparation_only", providersPluggable: ["remotion", "ffmpeg", "runway", "veo", "sora", "internal_worker"] } };
  const { data, error } = await db().from("growth_engine_render_jobs").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function listRenderJobs() {
  const { data, error } = await db().from("growth_engine_render_jobs").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function getRenderJob(id: string) {
  const { data, error } = await db().from("growth_engine_render_jobs").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function overview() {
  const [runs, features, campaigns, drafts, signals, sources, assetPlans, screenshotRequests, renderCompositions, renderJobs] = await Promise.all([db().from("internal_growth_agent_runs").select("*").order("created_at", { ascending: false }).limit(20), db().from("internal_growth_features").select("*").order("updated_at", { ascending: false }).limit(200), db().from("internal_growth_campaigns").select("*").order("updated_at", { ascending: false }).limit(200), db().from("internal_growth_drafts").select("*").order("updated_at", { ascending: false }).limit(500), db().from("growth_engine_signals").select("*").order("updated_at", { ascending: false }).limit(200), db().from("growth_engine_sources").select("*").order("updated_at", { ascending: false }).limit(20), db().from("growth_engine_asset_plans").select("*").order("updated_at", { ascending: false }).limit(200), db().from("growth_engine_screenshot_requests").select("*").order("updated_at", { ascending: false }).limit(300), db().from("growth_engine_render_compositions").select("*").order("updated_at", { ascending: false }).limit(200), db().from("growth_engine_render_jobs").select("*").order("updated_at", { ascending: false }).limit(200)]);
  const draftCountsByPlatform = (drafts.data ?? []).reduce((acc: Record<string, number>, draft: Record<string, unknown>) => { const key = String(draft.platform); acc[key] = (acc[key] ?? 0) + 1; return acc; }, {});
  const latestRun = (runs.data ?? [])[0] ?? null;
  return { runs: runs.data ?? [], features: features.data ?? [], campaigns: campaigns.data ?? [], drafts: drafts.data ?? [], signals: signals.data ?? [], sources: sources.data ?? [], assetPlans: assetPlans.data ?? [], screenshotRequests: screenshotRequests.data ?? [], renderCompositions: renderCompositions.data ?? [], renderJobs: renderJobs.data ?? [], summary: { totalFeatures: (features.data ?? []).length, approvedFeatures: (features.data ?? []).filter((f: Record<string, unknown>) => f.status === "approved").length, ignoredFeatures: (features.data ?? []).filter((f: Record<string, unknown>) => f.status === "ignored").length, totalCampaigns: (campaigns.data ?? []).length, draftCountsByPlatform, latestRunState: latestRun ? { status: latestRun.status, createdAt: latestRun.created_at, error: latestRun.error_message } : null } };
}
