import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { getEditorPath } from "@/features/shopreel/lib/editorPaths";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { StoryDraft, StoryScene } from "@/features/shopreel/story-builder/types";
import GenerationDeleteButton from "@/features/shopreel/generations/components/GenerationDeleteButton";
import GenerationTimelineEditor from "@/features/shopreel/generations/components/GenerationTimelineEditor";
import PublishPlatformButtons from "@/features/shopreel/publishing/components/PublishPlatformButtons";

type BlogSection = {
  key: string;
  title: string;
  body: string;
};

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asStoryDraft(value: unknown): StoryDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as StoryDraft;
}

function asBlogSections(value: unknown): BlogSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((section) => {
      if (!section || typeof section !== "object" || Array.isArray(section)) return null;
      const record = section as Record<string, unknown>;
      if (
        typeof record.key !== "string" ||
        typeof record.title !== "string" ||
        typeof record.body !== "string"
      ) {
        return null;
      }
      return {
        key: record.key,
        title: record.title,
        body: record.body,
      };
    })
    .filter((section): section is BlogSection => !!section);
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function ShopReelGenerationDetailPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: generation, error } = await legacy
    .from("shopreel_story_generations")
    .select("*")
    .eq("id", id)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!generation) {
    return (
      <GlassShell
        eyebrow="ShopReel"
        title="Generation not found"
        subtitle="This story generation does not exist for the current shop."
      >
        <GlassCard strong>
          <div className={cx("text-sm", glassTheme.text.secondary)}>
            No generation found.
          </div>
        </GlassCard>
      </GlassShell>
    );
  }

  const draft = asStoryDraft(generation.story_draft);
  const metadata = objectRecord(generation.generation_metadata);
  const outputType =
    typeof metadata.output_type === "string" ? metadata.output_type : "video";
  const textOutputs = objectRecord(metadata.text_outputs);
  const blog = objectRecord(textOutputs.blog);
  const blogSections = asBlogSections(blog.sections);

  const renderUrl =
    typeof metadata.render_url === "string" ? metadata.render_url : null;
  const thumbnailUrl =
    typeof metadata.thumbnail_url === "string" ? metadata.thumbnail_url : null;
  const publicationId =
    typeof metadata.publication_id === "string" ? metadata.publication_id : null;
  const editorPath = getEditorPath(outputType, generation.id);
  const canPublish = generation.status === "ready";

  return (
    <GlassShell
      eyebrow="ShopReel"
      title={
        outputType === "blog" && typeof blog.title === "string" && blog.title.trim().length > 0
          ? blog.title
          : draft?.title ?? "Story generation"
      }
      subtitle="Review generated story structure, preview render output, and open the editor."
      actions={
        <>
          <Link href={editorPath}>
            <GlassButton variant="secondary">Open editor</GlassButton>
          </Link>
          <GenerationDeleteButton generationId={generation.id} />
          {generation.status === "ready" ? (
            <Link href={`/shopreel/publish-center`}>
              <GlassButton variant="ghost">Publish Center</GlassButton>
            </Link>
          ) : null}
        </>
      }
    >
      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard
          label="Story"
          title="Generation summary"
          description="This is the semantic story draft driving the render pipeline."
          strong
        >
          <div className="flex flex-wrap gap-2">
            <GlassBadge tone="default">{formatLabel(generation.status)}</GlassBadge>
            <GlassBadge tone="copper">{formatLabel(outputType)}</GlassBadge>
            {draft?.sourceKind ? (
              <GlassBadge tone="muted">{formatLabel(draft.sourceKind)}</GlassBadge>
            ) : null}
            {publicationId ? (
              <GlassBadge tone="copper">Publication linked</GlassBadge>
            ) : null}
          </div>

          <div
            className={cx(
              "rounded-2xl border p-4",
              canPublish ? glassTheme.border.copper : glassTheme.border.softer,
              glassTheme.glass.panelSoft
            )}
          >
            <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Publish
            </div>
            <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
              Queue this reviewed generation to one or more destinations.
            </div>
            <div className="mt-4">
              <PublishPlatformButtons generationId={generation.id} canPublish={canPublish} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Hook
              </div>
              <div className={cx("mt-2 text-sm", glassTheme.text.primary)}>
                {draft?.hook ?? "—"}
              </div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                CTA
              </div>
              <div className={cx("mt-2 text-sm", glassTheme.text.primary)}>
                {draft?.cta ?? "—"}
              </div>
            </div>
          </div>

          <div
            className={cx(
              "rounded-2xl border p-4",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
            )}
          >
            <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Caption
            </div>
            <div className={cx("mt-2 text-sm whitespace-pre-wrap", glassTheme.text.primary)}>
              {draft?.caption ?? "—"}
            </div>
          </div>

          {outputType === "blog" && typeof blog.body === "string" ? (
            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Blog preview
              </div>
              <div className={cx("mt-2 text-sm whitespace-pre-wrap", glassTheme.text.secondary)}>
                {blog.body}
              </div>
            </div>
          ) : (
            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Voiceover / Script
              </div>
              <div className={cx("mt-2 text-sm whitespace-pre-wrap", glassTheme.text.secondary)}>
                {draft?.voiceoverText ?? draft?.scriptText ?? "—"}
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Preview"
          title="Render output"
          description="Render preview and linked output metadata."
        >
          {renderUrl ? (
            <video
              src={renderUrl}
              controls
              playsInline
              className="w-full rounded-2xl border border-white/10 bg-black/30"
              poster={thumbnailUrl ?? undefined}
            />
          ) : thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Render thumbnail"
              className="w-full rounded-2xl border border-white/10 object-cover"
            />
          ) : (
            <div
              className={cx(
                "rounded-2xl border p-6 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No render preview yet.
            </div>
          )}

          <div className="grid gap-3">
            {[
              ["Generation ID", generation.id],
              ["Render Job", generation.render_job_id ?? "—"],
              ["Content Piece", generation.content_piece_id ?? "—"],
              ["Publication", publicationId ?? "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                  {label}
                </div>
                <div className={cx("mt-2 text-sm break-all", glassTheme.text.primary)}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <GenerationTimelineEditor
        generationId={generation.id}
        initialDraft={{
          title: draft?.title ?? null,
          hook: draft?.hook ?? null,
          cta: draft?.cta ?? null,
          caption: draft?.caption ?? null,
          scriptText: draft?.scriptText ?? null,
          voiceoverText: draft?.voiceoverText ?? null,
          scenes: (draft?.scenes ?? []).map((scene) => ({
            ...scene,
            durationSeconds:
              scene?.durationSeconds === undefined
                ? null
                : scene.durationSeconds,
          })),
        }}
      />

      {outputType === "blog" ? (
        <GlassCard
          label="Sections"
          title="Blog structure"
          description="Section-based article layout before editing."
          strong
        >
          <div className="grid gap-3">
            {blogSections.map((section, index) => (
              <div
                key={section.key}
                className={cx(
                  "grid gap-3 rounded-2xl border p-4 lg:grid-cols-[auto_1fr_auto]",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/80">
                  {index + 1}
                </div>

                <div className="space-y-1">
                  <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                    {section.title}
                  </div>
                  <div className={cx("text-xs", glassTheme.text.secondary)}>
                    {section.key}
                  </div>
                  <div className={cx("text-sm whitespace-pre-wrap", glassTheme.text.primary)}>
                    {section.body}
                  </div>
                </div>

                <div className="flex items-start justify-end">
                  <Link href={`/shopreel/editor/blog/${generation.id}?section=${section.key}`}>
                    <GlassButton variant="ghost">Edit section</GlassButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        <GlassCard
          label="Scenes"
          title="Story structure"
          description="Scene-level story layout before timeline editing."
          strong
        >
          <div className="grid gap-3">
            {(draft?.scenes ?? []).map((scene: StoryScene, index: number) => (
              <div
                key={scene.id}
                className={cx(
                  "grid gap-3 rounded-2xl border p-4 lg:grid-cols-[auto_1fr_auto]",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/80">
                  {index + 1}
                </div>

                <div className="space-y-1">
                  <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                    {scene.title}
                  </div>
                  <div className={cx("text-xs", glassTheme.text.secondary)}>
                    {formatLabel(scene.role)} • {scene.durationSeconds ?? 0}s • {scene.media.length} media
                  </div>
                  {scene.overlayText ? (
                    <div className={cx("text-sm", glassTheme.text.primary)}>
                      {scene.overlayText}
                    </div>
                  ) : null}
                  {scene.voiceoverText ? (
                    <div className={cx("text-xs", glassTheme.text.secondary)}>
                      {scene.voiceoverText}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-start justify-end">
                  <Link href={`/shopreel/editor/video/${generation.id}?scene=${scene.id}`}>
                    <GlassButton variant="ghost">Edit scene</GlassButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </GlassShell>
  );
}
