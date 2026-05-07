import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { editorSession } = (await req.json()) as { editorSession: unknown };
    const { shopId } = await requireUserActionTenantContext();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { data: generation, error: lookupError } = await legacy
      .from("shopreel_story_generations")
      .select("id, generation_metadata")
      .eq("id", id)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (lookupError || !generation) throw new Error(lookupError?.message ?? "Generation not found");

    const metadata = generation.generation_metadata && typeof generation.generation_metadata === "object" && !Array.isArray(generation.generation_metadata)
      ? generation.generation_metadata
      : {};

    const { data, error } = await legacy
      .from("shopreel_story_generations")
      .update({ generation_metadata: { ...metadata, editor_session: editorSession }, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("shop_id", shopId)
      .select("id")
      .single();

    if (error || !data?.id) throw new Error(error?.message ?? "Failed to persist editor session");

    return NextResponse.json({ ok: true, generationId: data.id });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to persist editor session");
  }
}
