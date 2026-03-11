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
    .from("content_assets")
    .select("id, title, asset_type, metadata, created_at")
    .eq("id", assetId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "No manual asset found");
  }

  const metadata =
    data.metadata &&
    typeof data.metadata === "object" &&
    !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>)
      : {};

  const contentType =
    typeof metadata.content_type === "string"
      ? metadata.content_type
      : data.asset_type ?? "manual_upload";

  const aiScore =
    typeof metadata.ai_score === "number" ? metadata.ai_score : null;

  return {
    ok: true,
    assetId,
    videoId: data.id,
    title: data.title ?? "Manual upload",
    contentType,
    status: "ready",
    aiScore,
    source: "manual_upload",
  };
}