import type { Database } from "@/types/supabase";

type MediaJobRow =
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

export function getMediaJobEditorPath(job: MediaJobRow): string | null {
  if (!job.source_content_piece_id) return null;

  if (job.job_type === "image") {
    return `/shopreel/content/${job.source_content_piece_id}`;
  }

  return `/shopreel/editor/video/${job.source_content_piece_id}`;
}
