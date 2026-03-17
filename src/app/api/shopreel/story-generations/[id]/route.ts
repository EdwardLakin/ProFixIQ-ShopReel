import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { data: generation, error: generationLookupError } = await legacy
      .from("shopreel_story_generations")
      .select("id, shop_id, content_piece_id, render_job_id, generation_metadata")
      .eq("id", id)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (generationLookupError) {
      throw new Error(generationLookupError.message);
    }

    if (!generation) {
      return NextResponse.json(
        { ok: false, error: "Story generation not found" },
        { status: 404 }
      );
    }

    const metadata =
      generation.generation_metadata &&
      typeof generation.generation_metadata === "object" &&
      !Array.isArray(generation.generation_metadata)
        ? generation.generation_metadata
        : {};

    const publicationId =
      typeof (metadata as Record<string, unknown>).publication_id === "string"
        ? ((metadata as Record<string, unknown>).publication_id as string)
        : null;

    const publishJobId =
      typeof (metadata as Record<string, unknown>).publish_job_id === "string"
        ? ((metadata as Record<string, unknown>).publish_job_id as string)
        : null;

    if (publishJobId) {
      await legacy
        .from("shopreel_publish_jobs")
        .delete()
        .eq("id", publishJobId)
        .eq("shop_id", shopId);
    }

    if (publicationId) {
      await legacy
        .from("content_publications")
        .delete()
        .eq("id", publicationId);
    }

    if (generation.render_job_id) {
      await legacy
        .from("reel_render_jobs")
        .delete()
        .eq("id", generation.render_job_id)
        .eq("shop_id", shopId);
    }

    if (generation.content_piece_id) {
      await legacy
        .from("content_publications")
        .delete()
        .eq("content_piece_id", generation.content_piece_id);

      await legacy
        .from("content_calendar_items")
        .delete()
        .eq("content_piece_id", generation.content_piece_id);

      await legacy
        .from("content_events")
        .delete()
        .eq("content_piece_id", generation.content_piece_id);

      await legacy
        .from("content_analytics_events")
        .delete()
        .eq("content_piece_id", generation.content_piece_id);

      await legacy
        .from("content_pieces")
        .delete()
        .eq("id", generation.content_piece_id);
    }

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
      { status: 500 }
    );
  }
}
