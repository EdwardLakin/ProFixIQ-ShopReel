"use server";

import { createAdminClient } from "@/lib/supabase/server";

export async function deleteContentPiece(contentPieceId: string) {
  const supabase = createAdminClient();

  await supabase
    .from("content_pieces")
    .delete()
    .eq("id", contentPieceId);

  return { ok: true };
}

export async function archiveContentPiece(contentPieceId: string) {
  const supabase = createAdminClient();

  await supabase
    .from("content_pieces")
    .update({ status: "archived" })
    .eq("id", contentPieceId);

  return { ok: true };
}

export async function duplicateContentPiece(contentPieceId: string) {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("id", contentPieceId)
    .single();

  if (!data) {
    throw new Error("Content not found");
  }

  const { data: inserted } = await supabase
    .from("content_pieces")
    .insert({
      title: data.title,
      caption: data.caption,
      hook: data.hook,
      cta: data.cta,
      content_type: data.content_type,
      script_text: data.script_text,
      voiceover_text: data.voiceover_text,
      metadata: data.metadata,
      platform_targets: data.platform_targets,
      status: "draft",
      created_at: new Date().toISOString(),
    } as any)
    .select("*")
    .single();

  return inserted;
}
