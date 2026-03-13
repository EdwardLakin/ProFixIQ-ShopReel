import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { StoryDraft } from "@/features/shopreel/story-builder/types";

type Body = {
  storyDraft?: StoryDraft;
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Body;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    if (!body.storyDraft) {
      return NextResponse.json(
        { ok: false, error: "storyDraft is required" },
        { status: 400 },
      );
    }

    const { data, error } = await legacy
      .from("shopreel_story_generations")
      .update({
        story_draft: body.storyDraft,
        updated_at: new Date().toISOString(),
        status: "draft",
      })
      .eq("id", id)
      .eq("shop_id", shopId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      ok: true,
      generation: data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update story generation";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { error } = await legacy
      .from("shopreel_story_generations")
      .delete()
      .eq("id", id)
      .eq("shop_id", shopId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      ok: true,
      deletedId: id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete story generation";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
