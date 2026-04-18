import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  requireUserActionTenantContext,
  toEndpointErrorResponse,
} from "@/features/shopreel/server/endpointPolicy";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const { storyDraft } = (await req.json()) as {
      storyDraft: unknown;
    };

    const { shopId } = await requireUserActionTenantContext();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { data, error } = await legacy
      .from("shopreel_story_generations")
      .update({
        story_draft: storyDraft,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("shop_id", shopId)
      .select("id")
      .single();

    if (error || !data?.id) {
      throw new Error(error?.message ?? "Failed to save story draft");
    }

    return NextResponse.json({
      ok: true,
      generationId: data.id,
    });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to save story draft");
  }
}
