import { createAdminClient } from "@/lib/supabase/server";
import type { DiscoveredGrowthFeature, GrowthCampaignType, GrowthDraftStatus, GrowthFeatureStatus, GrowthPlatform, GrowthRunStatus } from "./types";
import { buildCampaignObjective, buildCampaignTitle, platformsOrDefault } from "./campaignPlanner";
import { buildDraftSeeds } from "./draftGenerator";
import { ShopReelEndpointError } from "@/features/shopreel/server/endpointPolicy";

function db() { return createAdminClient() as unknown as { from: (table: string) => any }; }

async function logAudit(actor: string, action: string, entityType: string, entityId: string, beforeState: unknown, afterState: unknown) {
  await db().from("internal_growth_audit_logs").insert({ actor, action, entity_type: entityType, entity_id: entityId, before_state: beforeState, after_state: afterState });
}

export async function createRun(createdBy: string, status: GrowthRunStatus) { const { data, error } = await db().from("internal_growth_agent_runs").insert({ created_by: createdBy, status, source_type: "code_scan" }).select("*").single(); if (error) throw error; return data as { id: string }; }
export async function completeRun(runId: string, status: GrowthRunStatus, summary: string, errorMessage?: string) { const payload: { status: GrowthRunStatus; summary: string; error_message?: string } = { status, summary }; if (errorMessage) payload.error_message = errorMessage; await db().from("internal_growth_agent_runs").update(payload).eq("id", runId); }

export async function upsertFeatures(features: DiscoveredGrowthFeature[], runId: string) {
  const normalized = new Map(features.map((feature) => [feature.featureKey.toLowerCase(), feature]));
  const rows = Array.from(normalized.values()).map((feature) => ({ run_id: runId, feature_key: feature.featureKey.toLowerCase(), title: feature.title, description: feature.description, route_path: feature.routePath, source_files: feature.sourceFiles, audience: feature.audience, value_props: feature.valueProps, launch_angle: feature.launchAngle, metadata: feature.scanMetadata ?? {} }));
  const { data, error } = await db().from("internal_growth_features").upsert(rows, { onConflict: "feature_key" }).select("*");
  if (error) throw error;
  return (data ?? []) as Array<{ id: string }>;
}

export async function updateFeatureStatus(actor: string, id: string, status: GrowthFeatureStatus) {
  const { data: before } = await db().from("internal_growth_features").select("*").eq("id", id).single();
  const { data, error } = await db().from("internal_growth_features").update({ status }).eq("id", id).select("*").single();
  if (error) throw error;
  await logAudit(actor, `feature.${status}`, "feature", id, before, data);
  return data;
}

export async function generateCampaign(actor: string, featureId: string, campaignType: GrowthCampaignType, targetPlatforms: GrowthPlatform[], forceRegenerate = false) {
  const { data: feature, error: featureError } = await db().from("internal_growth_features").select("*").eq("id", featureId).single(); if (featureError) throw featureError;
  const platforms = platformsOrDefault(targetPlatforms);
  const { data: existing } = await db().from("internal_growth_campaigns").select("*").eq("feature_id", featureId).eq("campaign_type", campaignType).eq("target_platforms", platforms).limit(1);
  if (!forceRegenerate && existing?.length) throw new ShopReelEndpointError("Campaign already exists for this feature/type/platform set. Use forceRegenerate to create another.", 409);
  const { data: campaign, error: campaignError } = await db().from("internal_growth_campaigns").insert({ feature_id: featureId, title: buildCampaignTitle(feature.title as string, campaignType), campaign_type: campaignType, objective: buildCampaignObjective(feature.title as string), target_platforms: platforms, status: "draft" }).select("*").single(); if (campaignError) throw campaignError;
  const seeds = buildDraftSeeds(feature.title as string, feature.description as string, platforms);
  const { data: drafts, error: draftsError } = await db().from("internal_growth_drafts").insert(seeds.map((seed) => ({ campaign_id: campaign.id, platform: seed.platform, format: seed.format, title: seed.title, body: seed.body, hook: seed.hook, cta: seed.cta, status: "draft" }))).select("*"); if (draftsError) throw draftsError;
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

export async function overview() {
  const [runs, features, campaigns, drafts] = await Promise.all([db().from("internal_growth_agent_runs").select("*").order("created_at", { ascending: false }).limit(20), db().from("internal_growth_features").select("*").order("updated_at", { ascending: false }).limit(200), db().from("internal_growth_campaigns").select("*").order("updated_at", { ascending: false }).limit(200), db().from("internal_growth_drafts").select("*").order("updated_at", { ascending: false }).limit(500)]);
  const draftCountsByPlatform = (drafts.data ?? []).reduce((acc: Record<string, number>, draft: Record<string, unknown>) => { const key = String(draft.platform); acc[key] = (acc[key] ?? 0) + 1; return acc; }, {});
  const latestRun = (runs.data ?? [])[0] ?? null;
  return { runs: runs.data ?? [], features: features.data ?? [], campaigns: campaigns.data ?? [], drafts: drafts.data ?? [], summary: { totalFeatures: (features.data ?? []).length, approvedFeatures: (features.data ?? []).filter((f: Record<string, unknown>) => f.status === "approved").length, ignoredFeatures: (features.data ?? []).filter((f: Record<string, unknown>) => f.status === "ignored").length, totalCampaigns: (campaigns.data ?? []).length, draftCountsByPlatform, latestRunState: latestRun ? { status: latestRun.status, createdAt: latestRun.created_at, error: latestRun.error_message } : null } };
}
