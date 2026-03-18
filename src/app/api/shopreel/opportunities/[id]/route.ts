import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { suppressStorySource } from "@/features/shopreel/opportunities/lib/suppressStorySource";

type DB = Database;

const supabase = createClient<DB>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { data: opportunity, error: fetchError } = await supabase
    .from("shopreel_content_opportunities")
    .select("id, shop_id, story_source_id")
    .eq("id", id)
    .single();

  if (fetchError || !opportunity) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  if (opportunity.story_source_id) {
    const { data: source } = await supabase
      .from("shopreel_story_sources")
      .select("source_key")
      .eq("id", opportunity.story_source_id)
      .single();

    if (source?.source_key) {
      await suppressStorySource(
        supabase,
        opportunity.shop_id,
        source.source_key
      );
    }
  }

  const { error } = await supabase
    .from("shopreel_content_opportunities")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
