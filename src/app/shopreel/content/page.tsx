import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { createAdminClient } from "@/lib/supabase/server";
import ContentLibraryClient from "@/features/shopreel/content/components/ContentLibraryClient";

type OutputType = "video" | "blog" | "email" | "post" | "vlog";

type ContentLibraryItem = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  outputType: OutputType;
  sourceKind: string;
};

function normalizeOutputType(value: unknown): OutputType {
  if (value === "blog" || value === "email" || value === "post" || value === "vlog") return value;
  return "video";
}

export default async function ShopReelContentLibraryPage() {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data, error } = await legacy
    .from("shopreel_story_generations")
    .select("id, status, created_at, generation_metadata, story_draft")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const items: ContentLibraryItem[] = (data ?? []).map((row: any) => {
    const metadata =
      row.generation_metadata && typeof row.generation_metadata === "object"
        ? row.generation_metadata
        : {};
    const draft =
      row.story_draft && typeof row.story_draft === "object"
        ? row.story_draft
        : {};

    return {
      id: String(row.id),
      title: typeof draft.title === "string" ? draft.title : "Untitled",
      status: typeof row.status === "string" ? row.status : "draft",
      createdAt:
        typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
      outputType: normalizeOutputType(metadata.output_type),
      sourceKind:
        typeof draft.sourceKind === "string" ? draft.sourceKind : "creator_idea",
    };
  });

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Content Library"
      subtitle="Unified library for videos, vlogs, blogs, emails, and social posts."
      actions={
        <Link href="/shopreel/create">
          <GlassButton variant="primary">Create content</GlassButton>
        </Link>
      }
    >
      <ShopReelNav />
      <ContentLibraryClient initialItems={items} />
    </GlassShell>
  );
}
