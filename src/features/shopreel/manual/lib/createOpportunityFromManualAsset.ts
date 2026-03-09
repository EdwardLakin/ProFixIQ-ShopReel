// src/features/shopreel/manual/lib/createOpportunityFromManualAsset.ts

import { createAdminClient } from "@/lib/supabase/server";

export type ManualAssetOpportunity = {
  ok: true;
  assetId: string;
  videoId: string;
  title: string;
  contentType: string;
  status: string;
  aiScore: number | null;
  source: "manual_upload";
};

export async function createOpportunityFromManualAsset(
  assetId: string,
): Promise<ManualAssetOpportunity> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("videos")
    .select("id, title, content_type, status, ai_score, source_asset_id, created_at")
    .eq("source_asset_id", assetId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "No generated video found for manual asset");
  }

  return {
    ok: true,
    assetId,
    videoId: data.id,
    title: data.title,
    contentType: data.content_type,
    status: data.status,
    aiScore: data.ai_score ?? null,
    source: "manual_upload",
  };
}