import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import {
  ensureScenesForCampaignItem,
  createMediaJobsForCampaignItemScenes,
} from "@/features/shopreel/campaigns/lib/multiscene";
import type { Json } from "@/types/supabase";

type CreativeProfileInput = {
  style?: string | null;
  visualMode?: string | null;
  aspectRatio?: string | null;
  durationSeconds?: number | null;
  cameraStyle?: string | null;
  lighting?: string | null;
  energy?: string | null;
  rebuildMediaJobs?: boolean;
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();
    const body = (await req.json()) as CreativeProfileInput;

    const { data: item, error: itemError } = await supabase
      .from("shopreel_campaign_items")
      .select("*")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (itemError || !item) {
      throw new Error(itemError?.message ?? "Campaign item not found");
    }

    const existingMetadata = asObject(item.metadata);
    const existingCreativeProfile = asObject(existingMetadata.creative_profile);

    const creativeProfile: Json = {
      style: body.style ?? item.style ?? "cinematic",
      visualMode: body.visualMode ?? item.visual_mode ?? "photoreal",
      aspectRatio: body.aspectRatio ?? item.aspect_ratio ?? "9:16",
      durationSeconds:
        typeof body.durationSeconds === "number"
          ? body.durationSeconds
          : Number(item.duration_seconds ?? 8),
      cameraStyle:
        body.cameraStyle ??
        (typeof existingCreativeProfile.cameraStyle === "string"
          ? existingCreativeProfile.cameraStyle
          : "handheld_close"),
      lighting:
        body.lighting ??
        (typeof existingCreativeProfile.lighting === "string"
          ? existingCreativeProfile.lighting
          : "soft_natural"),
      energy:
        body.energy ??
        (typeof existingCreativeProfile.energy === "string"
          ? existingCreativeProfile.energy
          : "confident_modern"),
    };

    const nextMetadata: Json = {
      ...existingMetadata,
      creative_profile: creativeProfile,
    };

    const { error: updateError } = await supabase
      .from("shopreel_campaign_items")
      .update({
        style:
          typeof (creativeProfile as Record<string, Json>).style === "string"
            ? ((creativeProfile as Record<string, Json>).style as string)
            : item.style,
        visual_mode:
          typeof (creativeProfile as Record<string, Json>).visualMode === "string"
            ? ((creativeProfile as Record<string, Json>).visualMode as string)
            : item.visual_mode,
        aspect_ratio:
          typeof (creativeProfile as Record<string, Json>).aspectRatio === "string"
            ? ((creativeProfile as Record<string, Json>).aspectRatio as string)
            : item.aspect_ratio,
        duration_seconds:
          typeof (creativeProfile as Record<string, Json>).durationSeconds === "number"
            ? ((creativeProfile as Record<string, Json>).durationSeconds as number)
            : item.duration_seconds,
        metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("shop_id", shopId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const scenes = await ensureScenesForCampaignItem(item.id);

    let createdJobIds: string[] = [];
    if (body.rebuildMediaJobs) {
      createdJobIds = await createMediaJobsForCampaignItemScenes(item.id);
    }

    revalidatePath(`/shopreel/campaigns/${item.campaign_id}`);
    revalidatePath(`/shopreel/campaigns/items/${item.id}`);

    return NextResponse.json({
      ok: true,
      creativeProfile,
      scenesUpdated: scenes.length,
      rebuiltSceneJobs: createdJobIds.length,
      createdJobIds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save creative profile",
      },
      { status: 500 }
    );
  }
}
