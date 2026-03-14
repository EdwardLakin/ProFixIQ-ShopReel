 "use server";

import { createAdminClient } from "@/lib/supabase/server";

export async function regenerateContent(contentPieceId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("content_pieces")
    .update({
      status: "queued",
      updated_at: new Date().toISOString(),
    })
    .eq("id", contentPieceId);

  if (error) {
    throw new Error(error.message);
  }

  return { queued: true };
}
