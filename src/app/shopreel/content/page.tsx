import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";

type OutputType = "video" | "blog" | "email" | "post" | "vlog";

type ContentLibraryItem = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  outputType: OutputType;
  sourceKind: string;
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeOutputType(value: unknown): OutputType {
  if (value === "blog" || value === "email" || value === "post" || value === "vlog") return value;
  return "video";
}

function editorPath(outputType: OutputType, generationId: string) {
  if (outputType === "blog") return `/shopreel/editor/blog/${generationId}`;
  if (outputType === "email") return `/shopreel/editor/email/${generationId}`;
  if (outputType === "post") return `/shopreel/editor/post/${generationId}`;
  if (outputType === "vlog") return `/shopreel/editor/vlog/${generationId}`;
  return `/shopreel/editor/${generationId}`;
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

      <GlassCard
        label="Library"
        title="All generated content"
        description="Browse every generated content item regardless of output type."
        strong
      >
        {items.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary,
            )}
          >
            No content yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={cx(
                  "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className="space-y-1">
                  <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                    {item.title}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.secondary)}>
                    {formatLabel(item.outputType)} • {formatLabel(item.sourceKind)} •{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <GlassBadge tone="copper">{formatLabel(item.outputType)}</GlassBadge>
                  <GlassBadge tone="default">{formatLabel(item.status)}</GlassBadge>

                  <Link href={`/shopreel/generations/${item.id}`}>
                    <GlassButton variant="ghost">Review</GlassButton>
                  </Link>
                  <Link href={editorPath(item.outputType, item.id)}>
                    <GlassButton variant="secondary">Edit</GlassButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </GlassShell>
  );
}
