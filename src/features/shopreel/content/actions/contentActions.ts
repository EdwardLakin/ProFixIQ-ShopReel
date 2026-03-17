"use server";

import { createAdminClient } from "@/lib/supabase/server";

export async function archiveContentPiece(contentPieceId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("content_pieces")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", contentPieceId);

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}

export async function duplicateContentPiece(contentPieceId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("id", contentPieceId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Content not found");
  }

  const { data: inserted, error: insertError } = await supabase
    .from("content_pieces")
    .insert({
      tenant_shop_id: data.tenant_shop_id ?? null,
      source_shop_id: data.source_shop_id ?? null,
      source_system: data.source_system ?? "shopreel",
      template_id: data.template_id ?? null,
      title: data.title,
      hook: data.hook,
      caption: data.caption,
      cta: data.cta,
      script_text: data.script_text,
      voiceover_text: data.voiceover_text,
      status: "draft",
      content_type: data.content_type,
      platform_targets: data.platform_targets ?? [],
      render_url: null,
      thumbnail_url: data.thumbnail_url ?? null,
      metadata: data.metadata ?? {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .select("*")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return inserted;
}
