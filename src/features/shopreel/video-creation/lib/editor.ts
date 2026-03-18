import type { Database } from "@/types/supabase";

type MediaJob = Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

export function getMediaJobPrimaryAction(job: MediaJob): {
  href: string | null;
  label: string | null;
} {
  if (job.source_generation_id) {
    return {
      href: `/shopreel/editor/video/${job.source_generation_id}`,
      label: "Open in editor",
    };
  }

  if (job.source_content_piece_id) {
    return {
      href: `/shopreel/content`,
      label: "Open content",
    };
  }

  return {
    href: null,
    label: null,
  };
}
