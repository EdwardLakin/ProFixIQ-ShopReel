import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireUserActionTenantContext, toEndpointErrorResponse, ShopReelEndpointError } from "@/features/shopreel/server/endpointPolicy";
import { DEFAULT_SHOPREEL_PLATFORM_IDS, SHOPREEL_PLATFORM_PRESETS } from "@/features/shopreel/platforms/presets";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shopId, userId } = await requireUserActionTenantContext();
    const { id } = await params;
    const supabase = createAdminClient();
    const { data: job } = await supabase.from("reel_render_jobs").select("id,shop_id,status,render_url,thumbnail_url,content_piece_id").eq("id", id).maybeSingle();
    if (!job || job.shop_id !== shopId) throw new ShopReelEndpointError("Render job not found", 404);
    if (job.status !== "ready" || !job.render_url) throw new ShopReelEndpointError("Render job is not ready for manual export", 400);
    const { data: existing } = await supabase.from("shopreel_export_packages").select("id").eq("shop_id", shopId).eq("render_job_id", id).maybeSingle();
    if (existing?.id) return NextResponse.json({ ok: true, exportPackageId: existing.id, exportUrl: `/shopreel/exports?packageId=${existing.id}` });
    const { data: generation } = await supabase.from("shopreel_story_generations").select("id,story_draft,generation_metadata").eq("shop_id", shopId).eq("render_job_id", id).maybeSingle();
    const draft = (generation?.story_draft && typeof generation.story_draft === "object" && !Array.isArray(generation.story_draft)) ? generation.story_draft as Record<string, unknown> : {};
    const caption = typeof draft.caption === "string" ? draft.caption : null;
    const hashtags = Array.isArray(draft.hashtags) ? draft.hashtags.filter((h): h is string => typeof h === "string") : [];
    const outputs = Object.fromEntries(DEFAULT_SHOPREEL_PLATFORM_IDS.map((pid)=>[pid,{captionText:caption??"",hashtags,checklist:SHOPREEL_PLATFORM_PRESETS.find(p=>p.id===pid)?.uploadChecklist ?? []}]));
    const { data: created, error } = await supabase.from("shopreel_export_packages").insert({ shop_id: shopId, generation_id: generation?.id ?? null, render_job_id: id, content_piece_id: job.content_piece_id ?? null, status: "ready", mp4_path: job.render_url, thumbnail_path: job.thumbnail_url, caption_text: caption, hashtags, platform_outputs: outputs, checklist: [] as string[], created_by: userId }).select("id").single();
    if (error || !created) throw new Error(error?.message ?? "Failed creating export package");
    return NextResponse.json({ ok: true, exportPackageId: created.id, exportUrl: `/shopreel/exports?packageId=${created.id}` });
  } catch (error) { return toEndpointErrorResponse(error, "Failed to create export package"); }
}
